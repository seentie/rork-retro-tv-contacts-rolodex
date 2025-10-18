export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  countryCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  birthday?: string;
  holidayCard: boolean;
  notes?: string;
  photoUri?: string;
  businessCardUri?: string;
  tvShow?: string;
  isFictional?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TVShow {
  id: string;
  name: string;
  decade: string;
  type: string;
}