import dotenv from 'dotenv';
import mongoose from 'mongoose';


dotenv.config();
const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        if(mongoose.connection.readyState === 1){
            console.log(`MongoDb host: ${mongoose.connection.host} and status: ${mongoose.connection.readyState}`);
            console.log("MongoDB is successfully connected");
        }
    }
    catch(error){
        console.log("There is an error in the connection ",error);
    }
}

let gfs;
(()=>{
    mongoose.connection.on('connected', ()=>{
        gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db,{
            bucketName: 'audioBucket',
        });
        console.log("Bucket is connected");
    });
})();

export default connectDB;
export {gfs};