export interface Option {
  icon?: string;
  text: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  options?: (string | Option)[];
  selectedOption?: string;
  timestamp: Date;
  next_step?: string;
  step?: string;
  type?: 'text' | 'flow' | 'option' | 'flow_returning' | 'flow_welcome';
  start_time?: string;
}

export interface Contact {
  id?: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  contact_name?: string;
} 

export interface OCRData {
  full_name: string | null;
  phone_number: string | null;
  location: string | null;
  designation: string | null;
  company: string | null;
  email: string | null;
}

export interface OCRResponse {
  status: string;
  data: OCRData;
  summary: string;
}

