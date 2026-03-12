
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getNowISOString = (): string => {
  return new Date().toISOString();
};

export const parseDateString = (dateStr: string): Date => {
  // Parses YYYY-MM-DD as local date
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
