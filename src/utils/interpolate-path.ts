
type PathCommand = 'M' | 'L' | 'H' | 'V' | 'C' | 'S' | 'Q' | 'T' | 'A' | 'Z';

type EasingFunction = (t: number) => number;

type InterpolationFunction = (t: number) => string;

type UpdateCallback = (path: string, progress: number) => void;
type CompleteCallback = (finalPath: string) => void;

interface PathCommandObject {
  command: PathCommand;
  isRelative: boolean;
  coords: number[];
  original: string;
}

interface InterpolatorOptions {
  include?: (PathCommand | number)[];
  exclude?: (PathCommand | number)[];
  maxSegmentLength?: number;
}

interface AnimationOptions extends InterpolatorOptions {
  duration?: number;
  easing?: EasingFunction;
  onUpdate?: UpdateCallback;
  onComplete?: CompleteCallback;
}

// Point interface for coordinate handling
interface Point {
  x: number;
  y: number;
}

// Path parsing result interface
interface ParsedPath {
  commands: PathCommandObject[];
  totalLength: number;
}

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class PathInterpolator {
  private readonly include: (PathCommand | number)[];
  private readonly exclude: (PathCommand | number)[];
  private readonly maxSegmentLength: number;

  constructor(options: InterpolatorOptions = {}) {
    this.include = options.include || [];
    this.exclude = options.exclude || [];
    this.maxSegmentLength = options.maxSegmentLength || 10;
  }

  /**
   * Validate SVG path string
   */
  private validatePath(pathString: string): ValidationResult {
    const errors: string[] = [];
    
    if (typeof pathString !== 'string') {
      errors.push('Path must be a string');
    }
    
    if (!pathString.trim()) {
      errors.push('Path cannot be empty');
    }

    // Basic SVG path validation
    const validCommands = /^[MmLlHhVvCcSsQqTtAaZz\d\s.,+-]*$/;
    if (!validCommands.test(pathString)) {
      errors.push('Path contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse SVG path string into command objects
   */
  public parsePath(pathString: string): ParsedPath {
    const validation = this.validatePath(pathString);
    if (!validation.isValid) {
      throw new Error(`Invalid path: ${validation.errors.join(', ')}`);
    }

    const commands: PathCommandObject[] = [];
    const regex = /([MmLlHhVvCcSsQqTtAaZz])((?:\s*-?\d*\.?\d+(?:[eE][+-]?\d+)?\s*,?\s*)*)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(pathString)) !== null) {
      const [fullMatch, command, coordsStr] = match;
      const coords = this.parseCoordinates(coordsStr);

      commands.push({
        command: command.toUpperCase() as PathCommand,
        isRelative: command === command.toLowerCase(),
        coords,
        original: fullMatch
      });
    }

    return {
      commands,
      totalLength: commands.length
    };
  }

  /**
   * Parse coordinate string into number array
   */
  private parseCoordinates(coordsStr: string): number[] {
    if (!coordsStr.trim()) return [];

    return coordsStr
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((coord: string): number => {
        const num = parseFloat(coord);
        if (isNaN(num)) {
          throw new Error(`Invalid coordinate: ${coord}`);
        }
        return num;
      });
  }

  /**
   * Convert all commands to absolute coordinates
   */
  public toAbsolute(commands: PathCommandObject[]): PathCommandObject[] {
    let currentPoint: Point = { x: 0, y: 0 };
    let startPoint: Point = { x: 0, y: 0 };

    return commands.map((cmd: PathCommandObject): PathCommandObject => {
      const { command, coords, isRelative } = cmd;
      const newCoords = [...coords];

      if (isRelative && coords.length > 0) {
        this.convertToAbsolute(command, newCoords, currentPoint);
      }

      // Update current position
      currentPoint = this.updateCurrentPosition(command, newCoords, currentPoint, startPoint);
      if (command === 'M') {
        startPoint = { ...currentPoint };
      } else if (command === 'Z') {
        currentPoint = { ...startPoint };
      }

      return {
        ...cmd,
        command,
        coords: newCoords,
        isRelative: false
      };
    });
  }

  /**
   * Convert relative coordinates to absolute
   */
  private convertToAbsolute(command: PathCommand, coords: number[], currentPoint: Point): void {
    switch (command) {
      case 'M':
      case 'L':
      case 'T':
        for (let i = 0; i < coords.length; i += 2) {
          coords[i] += currentPoint.x;
          coords[i + 1] += currentPoint.y;
        }
        break;
      case 'H':
        coords[0] += currentPoint.x;
        break;
      case 'V':
        coords[0] += currentPoint.y;
        break;
      case 'C':
      case 'S':
      case 'Q':
        for (let i = 0; i < coords.length; i += 2) {
          coords[i] += currentPoint.x;
          coords[i + 1] += currentPoint.y;
        }
        break;
      case 'A':
        if (coords.length >= 7) {
          coords[5] += currentPoint.x; // end x
          coords[6] += currentPoint.y; // end y
        }
        break;
    }
  }

  /**
   * Update current position based on command
   */
  private updateCurrentPosition(
    command: PathCommand, 
    coords: number[], 
    currentPoint: Point, 
    startPoint: Point
  ): Point {
    switch (command) {
      case 'M':
      case 'L':
      case 'T':
        return coords.length >= 2 
          ? { x: coords[coords.length - 2], y: coords[coords.length - 1] }
          : currentPoint;
      case 'H':
        return coords.length >= 1 
          ? { x: coords[0], y: currentPoint.y }
          : currentPoint;
      case 'V':
        return coords.length >= 1 
          ? { x: currentPoint.x, y: coords[0] }
          : currentPoint;
      case 'C':
      case 'S':
      case 'Q':
        return coords.length >= 2 
          ? { x: coords[coords.length - 2], y: coords[coords.length - 1] }
          : currentPoint;
      case 'A':
        return coords.length >= 7 
          ? { x: coords[5], y: coords[6] }
          : currentPoint;
      case 'Z':
        return { ...startPoint };
      default:
        return currentPoint;
    }
  }

  /**
   * Check if a command should be interpolated based on include/exclude rules
   */
  private shouldInterpolate(cmd: PathCommandObject, index: number): boolean {
    const commandType = cmd.command;
    
    // Check exclude rules first
    if (this.exclude.length > 0) {
      if (this.exclude.includes(commandType) || this.exclude.includes(index)) {
        return false;
      }
    }

    // Check include rules
    if (this.include.length > 0) {
      return this.include.includes(commandType) || this.include.includes(index);
    }

    // Default: interpolate everything except Z commands
    return commandType !== 'Z';
  }

  /**
   * Normalize paths to have the same number of commands
   */
  private normalizePaths(
    path1Commands: PathCommandObject[], 
    path2Commands: PathCommandObject[]
  ): [PathCommandObject[], PathCommandObject[]] {
    const commands1 = [...path1Commands];
    const commands2 = [...path2Commands];
    const maxLength = Math.max(commands1.length, commands2.length);
    
    // Pad shorter path with the last command (or a default L command)
    this.padCommands(commands1, maxLength);
    this.padCommands(commands2, maxLength);

    // Ensure commands have the same number of coordinates
    this.normalizeCoordinates(commands1, commands2);

    return [commands1, commands2];
  }

  /**
   * Pad command array to specified length
   */
  private padCommands(commands: PathCommandObject[], targetLength: number): void {
    while (commands.length < targetLength) {
      const lastCmd = commands[commands.length - 1];
      const padCmd: PathCommandObject = lastCmd 
        ? { ...lastCmd }
        : { command: 'L', coords: [0, 0], isRelative: false, original: 'L 0 0' };
      commands.push(padCmd);
    }
  }

  /**
   * Normalize coordinates between command arrays
   */
  private normalizeCoordinates(commands1: PathCommandObject[], commands2: PathCommandObject[]): void {
    for (let i = 0; i < commands1.length; i++) {
      const cmd1 = commands1[i];
      const cmd2 = commands2[i];
      
      if (cmd1.coords.length !== cmd2.coords.length) {
        const maxCoords = Math.max(cmd1.coords.length, cmd2.coords.length);
        
        this.padCoordinates(cmd1, maxCoords);
        this.padCoordinates(cmd2, maxCoords);
      }
    }
  }

  /**
   * Pad coordinates array to specified length
   */
  private padCoordinates(cmd: PathCommandObject, targetLength: number): void {
    while (cmd.coords.length < targetLength) {
      const lastX = cmd.coords.length >= 2 ? cmd.coords[cmd.coords.length - 2] : 0;
      const lastY = cmd.coords.length >= 1 ? cmd.coords[cmd.coords.length - 1] : 0;
      cmd.coords.push(lastX, lastY);
    }
  }

  /**
   * Linear interpolation between two numbers
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Create interpolation function between two paths
   */
  public interpolate(pathA: string, pathB: string): InterpolationFunction {
    const parsedA = this.parsePath(pathA);
    const parsedB = this.parsePath(pathB);
    
    const commandsA = this.toAbsolute(parsedA.commands);
    const commandsB = this.toAbsolute(parsedB.commands);
    
    const [normalizedA, normalizedB] = this.normalizePaths(commandsA, commandsB);

    return (t: number): string => {
      // Clamp t to [0, 1]
      const clampedT = Math.max(0, Math.min(1, t));
      
      const interpolatedCommands = normalizedA.map((cmdA, index) => {
        const cmdB = normalizedB[index];
        
        if (!this.shouldInterpolate(cmdA, index)) {
          // Don't interpolate, return original command
          return clampedT < 0.5 ? cmdA : cmdB;
        }

        // Interpolate coordinates
        const interpolatedCoords = cmdA.coords.map((coordA, coordIndex) => {
          const coordB = cmdB.coords[coordIndex] ?? coordA;
          return this.lerp(coordA, coordB, clampedT);
        });

        // Use command from target path (B) to handle command type transitions
        return {
          command: clampedT < 0.5 ? cmdA.command : cmdB.command,
          coords: interpolatedCoords,
          isRelative: false,
          original: ''
        } as PathCommandObject;
      });

      return this.commandsToPath(interpolatedCommands);
    };
  }

  /**
   * Convert command objects back to SVG path string
   */
  private commandsToPath(commands: PathCommandObject[]): string {
    return commands.map(cmd => {
      const { command, coords } = cmd;
      if (coords.length === 0) return command;
      
      const coordString = coords.map(c => 
        Number.isInteger(c) ? c.toString() : Number(c.toFixed(3)).toString()
      ).join(' ');
      
      return `${command} ${coordString}`;
    }).join(' ');
  }
}

function interpolatePath(pathA: string, pathB: string, options: InterpolatorOptions = {}): InterpolationFunction {
  const interpolator = new PathInterpolator(options);
  return interpolator.interpolate(pathA, pathB);
}

function animatePath(
  element: SVGPathElement | Element, 
  fromPath: string, 
  toPath: string, 
  options: AnimationOptions = {}
): void {
  const {
    duration = 1000,
    easing = (t: number): number => t, // linear easing
    include = [],
    exclude = [],
    onUpdate = (): void => {},
    onComplete = (): void => {}
  } = options;

  const interpolator = interpolatePath(fromPath, toPath, { include, exclude });
  const startTime = performance.now();

  function animate(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    
    const currentPath = interpolator(easedProgress);
    
    if ('setAttribute' in element) {
      element.setAttribute('d', currentPath);
    }
    
    onUpdate(currentPath, easedProgress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      onComplete(currentPath);
    }
  }

  requestAnimationFrame(animate);
}

// Common easing functions
const Easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
} as const;

// Export types and functions
export type {
  PathCommand,
  EasingFunction,
  InterpolationFunction,
  UpdateCallback,
  CompleteCallback,
  PathCommandObject,
  InterpolatorOptions,
  AnimationOptions,
  Point,
  ParsedPath,
  ValidationResult
};

export {
  PathInterpolator,
  interpolatePath,
  animatePath,
  Easing
};