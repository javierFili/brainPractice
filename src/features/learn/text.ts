/** Text for places that cannot hold markup (select options, aria labels): drops the backticks. */
export const plainText = (text: string) => text.replace(/`/g, '');
