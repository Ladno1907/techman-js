import { CPERRCode, TMSVRErrorCode, TMHeader } from "./index.js";

export interface ParsedTMSCT {
  header: TMHeader.Script;
  id: string;
  status: 'OK' | 'ERROR';
  OKLines?: number[];
  ERRORLines?: number[];
}

export const TM_TAGS = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15'] as const;
export const TM_STA_CUSTOM = ['90','91','92','93','94','95','96','97','98','99'] as const;

export type TMTagNumber = (typeof TM_TAGS)[number];
export type TMCustomSubCmd = (typeof TM_STA_CUSTOM)[number];
export type TMSTASubCmd = '00' | '01' | TMCustomSubCmd;

export interface ParsedTMSTA {
  header: TMHeader.Status;
  subCmd: TMSTASubCmd;
  content: 
    | { entry: boolean; message?: string }
    | { tagNumber: TMTagNumber; status: boolean | 'none' }
    | { rawData: string };
}

export interface ParsedCPERR {
  header: TMHeader.Error;
  errorCode: CPERRCode;
  message: string;
}

export interface ParsedTMSVR {
  header: TMHeader.Value;
  id: string;
  mode: 0 | 2 | 12; 
  ok: boolean;
  error?: { 
    code: TMSVRErrorCode; 
    message: string; 
    item?: string;
  };
  items?: Array<{ item: string; value: string }>;
}

export type ParsedSpecificPacket = ParsedTMSCT | ParsedTMSTA | ParsedTMSVR | ParsedCPERR;

export interface BuiltPacket {
  raw: string;
  id?: string;
}