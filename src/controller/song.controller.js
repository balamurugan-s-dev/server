import { gfs } from '../lib/db.js';
import * as mm from "music-metadata";
import AlbumArt from '../model/song.model.js';
import mongoose from 'mongoose';
import { ObjectId } from "mongodb";

export const postFile = async(req, res) => {
    try{

        const userName = req.user.name;

        if (!req.file) {
            return res.status(400).json({ error: "Upload failed, no file received." });
        }

        if (!gfs) {
            return res.status(500).json({ error: "GridFS is not initialized properly." });
        }

        const metadata = await mm.parseBuffer(req.file.buffer);

        let bufferData = null;
        let contentType = null;

        if (metadata.common.picture) {
            bufferData = Buffer.from(metadata.common.picture[0].data); 
            contentType = metadata.common.picture[0].format;
        }

        if (!bufferData || !contentType) {
            return res.status(400).json({ message: "No album art found in metadata" });
        }

        // Save to MongoDB
        const newImage = new AlbumArt({
            data: bufferData,
            contentType: contentType,
        });

        await newImage.save();

        // console.log(metadata);

        const writeStream = gfs.openUploadStream(req.file.originalname, {
            chunkSizeBytes: 1048576,
            contentType: metadata.format.container,
            metadata: {
                title: metadata.common.title || "Unknown Title",
                artist: metadata.common.artist || "Unknown Artist",
                album: metadata.common.album || "Unknown Album",
                year: metadata.common.year || "Unknown Year",
                genre: metadata.common.genre || "Unknown Genre",
                track: metadata.common.track || "Unknown Track",
                cover: metadata.common.Cover || "Unknown Cover",
                language: metadata.common.language || "Unknown Language",
                lyrics: metadata.common.lyricist || "Unknown Lyrics",
                duration: metadata.format.duration,
                bitrate: metadata.format.bitrate,
                sampleRate: metadata.format.sampleRate,
                size: req.file.size,
                mimeType: req.file.mimetype,
                albumArt: newImage._id,
                uploadedBy: userName,
            },
        });

        writeStream.write(req.file.buffer);
        writeStream.end();

        writeStream.on("error", (error) => {
            console.log("Error uploading audio file:", error);
            res.status(500).json({ error: "Error uploading audio file." });
        });

        writeStream.on("finish", () => {
            try{
                if(writeStream) {
                    console.log();
                    console.log("Audio file uploaded successfully.");
                    console.log("Song_ID:"+ writeStream.id);
                    console.log("Song_Name:"+ writeStream.filename);
                    return res.status(200).json({ 
                        message: "Audio file uploaded successfully.",
                        Object_id: writeStream.id,
                        filename: writeStream.filename,
                        uploadedBy: userName 
                    });
                }
            }
            catch(error){
                console.log("Error uploading audio file:", error);
                res.status(400).json({message: "Audio file is not uploaded"});
            }
        });
    }
    catch(error){
        console.log(error);
        res.status(400).json({message: "Audio file is not uploaded"});
    }
};

export const getList = async(req, res) => {
    try{
        const files = await mongoose.connection.db
                            .collection('audioBucket.files')
                            .find()
                            .toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ error: "No files found" });
        }

        res.status(200).json(files.map(file =>({
            _id: file._id.toString(),
            title: file.filename,
            artist: file.metadata.artist,
            album: file.metadata.album,
            year: file.metadata.year,
            genre: file.metadata.genre,
            track: file.metadata.track,
            cover: file.metadata.cover,
            language: file.metadata.language,
            lyrics: file.metadata.lyrics,
            duration: file.metadata.duration,
            bitrate: file.metadata.bitrate,
            sampleRate: file.metadata.sampleRate,
            size: file.metadata.size,
            mimeType: file.metadata.mimeType,
            albumArt: file.metadata.albumArt,
            uploadedBy: file.metadata.uploadedBy || "Unknown",
        })));
    }
    catch(error){
        console.log("There is an error in the connection ",error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const loadSong = async(req, res) => {
    try{
        const findFile = await mongoose.connection.db
                            .collection('audioBucket.files')
                            .findOne({filename: req.params.filename});

        if (!findFile) {
            return res.status(404).json({ error: "File not found" });
        }

        const readStream = gfs.openDownloadStream(findFile._id);
        res.set("Content-Type", findFile.metadata.mimeType);
        readStream.pipe(res);
    }
    catch(error){
        console.log("There is an error in the connection ",error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const loadAlbumArt = async(req, res) => {
    const id = req.params;

    try{
        if(!ObjectId.isValid(id)){
            return res.status(400).json({ error: "Invalid ID" });
        }
        // console.log("Image ID:", id);
        const image = await mongoose.connection.db
                            .collection('albumarts')
                            .findOne({_id: new ObjectId(id)});

        if (!image || !image.data) {
            return res.status(404).json({ message: "Image not found" });
        }

        const bufferData = image.data.buffer; 

        res.set("Content-Type", 'image/jpeg');
        res.send(bufferData);
    }
    catch(error){
        console.log("There is an error in the connection ",error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const deleteSong = async(req, res) => {
    try{
        const id = req.params.id;
        if(!ObjectId.isValid(id)){
            return res.status(400).json({ error: "Invalid ID" });
        }
        const file = await mongoose.connection.db
                            .collection('audioBucket.files')
                            .findOne({_id: new ObjectId(id)});

        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        await mongoose.connection.db
                            .collection('audioBucket.files')
                            .deleteOne({ _id: new ObjectId(id) });

        await mongoose.connection.db
                            .collection('albumarts')
                            .deleteOne({ _id: new ObjectId(file.metadata.albumArt) });

        res.status(200).json({ message: "File deleted successfully" });
    }
    catch(error){
        console.log("There is an error in the connection ",error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const searchSong = async (req, res) => {
    try {
      const { query } = req.query;
  
      if (!query || query.trim() === "") {
        return res.status(200).json([]);
      }
  
      const files = await mongoose.connection.db
        .collection('audioBucket.files')
        .find({ filename: { $regex: `^${query}`, $options: 'i' } })
        .limit(10)
        .toArray();
  
      if (!files || files.length === 0) {
        return res.status(404).json({ error: "No songs found" });
      }
  
      res.status(200).json(
        files.map((file) => ({
          _id: file._id.toString(),
          title: file.filename,
          artist: file.metadata?.artist || "Unknown",
          albumArt: file.metadata?.albumArt || null,
        }))
      );
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Server error while searching songs" });
    }
  };
  