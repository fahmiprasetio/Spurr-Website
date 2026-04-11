import framesData from "../../public/frames.json";

export type FramesMap = Record<string, string[]>;

export const framesMap = framesData as FramesMap;