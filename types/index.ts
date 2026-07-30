export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  freelancer_id: string;
  day_of_week: number; // 0=Sun … 6=Sat
  start_time: string;  // "HH:MM"
  end_time: string;    // "HH:MM"
  created_at: string;
}

export interface ServiceOffering {
  id: string;
  freelancer_id: string;
  title: string;
  description: string | null;
  duration_hours: number;
  price: number;
  created_at: string;
}

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

/** Shape returned by the get_booking_by_token RPC */
export interface ManagedBooking {
  id: string;
  status: BookingStatus;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  client_name: string;
  client_email: string;
  client_message: string | null;
  freelancer_id: string;
  freelancer_name: string | null;
  freelancer_username: string | null;
  freelancer_avatar: string | null;
  service_title: string | null;
  service_price: number | null;
}

export interface BookingRequest {
  id: string;
  freelancer_id: string;
  service_id: string | null;
  client_name: string;
  client_email: string;
  client_message: string | null;
  booking_date: string; // "YYYY-MM-DD"
  start_time: string;   // "HH:MM"
  duration_hours: number;
  status: BookingStatus;
  created_at: string;
  service_offerings?: ServiceOffering;
}

export interface Review {
  id: string;
  booking_id: string;
  freelancer_id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
