import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  code: { type: String, required: true },  // Ej: A1, A2
  status: { type: String, enum: ['available', 'reserved'], default: 'available' }
});

const parkingSpotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    hourlyRate: { type: Number, default: 0 },
    vehicleTypes: { type: [String], default: ['car', 'motorcycle'] },
    active: { type: Boolean, default: true },
    slots: { type: [slotSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model('ParkingSpot', parkingSpotSchema);
