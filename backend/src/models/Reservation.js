import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    spotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
    slotCode: { type: String, required: true }, // slot específico
    vehicleType: { type: String, enum: ['car', 'motorcycle', 'truck'], required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
  },
  { timestamps: true }
);

// Índices útiles
reservationSchema.index({ spotId: 1, slotCode: 1, start: 1, end: 1 });
reservationSchema.index({ userId: 1, start: -1 });

export default mongoose.model('Reservation', reservationSchema);
