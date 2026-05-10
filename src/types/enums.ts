export enum TMHeader {
  Script = 'TMSCT',  // Команды
  Status = 'TMSTA',  // Ответы на команды
  Value  = 'TMSVR',  // Данные мониторинга
  Error  = 'CPERR'   // Ошибки формата пакета
}