import { parsePostText } from './postFormatting';

describe('post text formatting', () => {
  test('marks text surrounded by single asterisks as bold', () => {
    expect(parsePostText('Hola *comunidad* querida')).toEqual([
      { bold: false, text: 'Hola ' },
      { bold: true, text: 'comunidad' },
      { bold: false, text: ' querida' },
    ]);
  });

  test('supports several bold spans without dropping plain text', () => {
    expect(parsePostText('*Uno* y *dos*')).toEqual([
      { bold: true, text: 'Uno' },
      { bold: false, text: ' y ' },
      { bold: true, text: 'dos' },
    ]);
  });

  test('keeps unmatched markers visible', () => {
    expect(parsePostText('Texto *sin cerrar')).toEqual([
      { bold: false, text: 'Texto *sin cerrar' },
    ]);
  });
});
