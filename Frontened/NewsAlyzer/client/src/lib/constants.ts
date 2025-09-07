export const NEWSPAPER_NAMES = [
  "The Indian Express",
  "The Hindu", 
  "Times of India",
  "Economic Times",
  "Hindustan Times",
  "The Telegraph",
  "Deccan Herald",
  "Business Standard"
];

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const getCurrentDate = (): string => {
  return formatDate(new Date());
};
