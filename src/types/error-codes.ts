export enum CPERRCode {
  NoError           = '00', // Пакет корректен
  PacketError       = '01', // Ошибка пакета (общая)
  ChecksumError     = '02', // Ошибка контрольной суммы
  HeaderError       = '03', // Ошибка заголовка
  PacketDataError   = '04', // Ошибка в данных пакета
  NotInListenNode   = 'F1'  // Робот не в режиме Listen
}

export const CPERRDescription: Record<CPERRCode, string> = {
  [CPERRCode.NoError]:         'Packet correct',
  [CPERRCode.PacketError]:     'Packet Error',
  [CPERRCode.ChecksumError]:   'Checksum Error',
  [CPERRCode.HeaderError]:     'Header Error',
  [CPERRCode.PacketDataError]: 'Packet Data Error',
  [CPERRCode.NotInListenNode]: 'Have not entered Listen Node'
};

export enum TMSVRErrorCode {
  OK              = '00', // Correct writing, no error
  NotSupport      = '01', // Communication format or mode not supported
  WritePermission = '02', // Connected client not permitted to write
  InvalidData     = '03', // Communication format and data content format mismatched
  NotExist        = '04', // Item to write or read does not exist
  ReadOnly        = '05', // Unable to write to read-only items
  ModeError       = '06', // Incorrect M/A mode while writing
  ValueError      = '07'  // Values to write mismatches with configured type or size
}

export const TMSVRDescription: Record<TMSVRErrorCode, string> = {
  [TMSVRErrorCode.OK]:              'Correct writing',
  [TMSVRErrorCode.NotSupport]:      'The communication format or mode is not supported',
  [TMSVRErrorCode.WritePermission]: 'The connected client is not permitted to write',
  [TMSVRErrorCode.InvalidData]:     'The communication format and the data content format are mismatched',
  [TMSVRErrorCode.NotExist]:        'Item to write or read does not exist',
  [TMSVRErrorCode.ReadOnly]:        'Unable to write to read-only items',
  [TMSVRErrorCode.ModeError]:       'Incorrect M/A mode while writing',
  [TMSVRErrorCode.ValueError]:      'Values to write mismatches with the configured type or the size'
};