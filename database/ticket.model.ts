import { model, models, Schema } from "mongoose";

export interface ITicket {
  sender_id: string;
  question: string;
  vehicle_type: string;
  location: string;
  status: string;
  createdAt: string;
}

const TicketSchema = new Schema<ITicket>({
  sender_id: { type: String, required: true },
  question: { type: String, required: true },
  vehicle_type: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: String },
});

const Ticket = models?.Ticket || model<ITicket>("Ticket", TicketSchema);

export default Ticket;
