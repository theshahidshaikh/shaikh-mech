
import mongoose from 'mongoose';

// Item Schema
const ItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: String,
  transactionType: String, // IN or OUT
  clientId: String,
  clientName: String,
  diameter: Number,
  grooves: Number,
  section: String,
  type: String,
  pulleyString: String,
  quantity: Number,
  rate: Number,
  costPerUnit: Number,
  machineCost: Number,
  boreUnits: Number,
  boreRate: Number,
  boreCost: Number,
  total: Number,
  remarks: String
});

// Client Schema
const ClientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  contact: String,
  defaultRate: Number
});

// Settings Schema
const SettingsSchema = new mongoose.Schema({
  companyName: String,
  companyAddress: String,
  gstNo: String,
  defaultRate: Number,
  boreRate: Number,
  currency: String
});

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // In real app, store hash!
  companyName: String
});

export const Item = mongoose.model('Item', ItemSchema);
export const Client = mongoose.model('Client', ClientSchema);
export const Settings = mongoose.model('Settings', SettingsSchema);
export const User = mongoose.model('User', UserSchema);
