import express from 'express';
import { postFile, getList, loadSong, loadAlbumArt, deleteSong, searchSong } from '../controller/song.controller.js';
import {upload} from '../middleware/multer.storage.js';
import { protect } from '../middleware/protectMiddleware.js';

const songrouter = express.Router();

songrouter.post('/upload', protect, upload.single('audio'), postFile);
songrouter.get('/list', getList);
songrouter.get('/load/:filename', loadSong);
songrouter.get('/albumart/:id', loadAlbumArt);

songrouter.delete('/delete/:id', protect, deleteSong);
songrouter.get('/search', searchSong);

export default songrouter;