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
  type?: 'text' | 'flow';
  start_time?: string;
}

export interface Contact {
  id?: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  contact_name?: string;
} 