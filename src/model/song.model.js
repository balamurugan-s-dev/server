import mongoose from 'mongoose';

const albumArtSchema = new mongoose.Schema({
    data: Buffer,         // Binary image data
    contentType: String,  // e.g., "image/jpeg"
});

const AlbumArt = mongoose.model("AlbumArt", albumArtSchema);

export default AlbumArt;