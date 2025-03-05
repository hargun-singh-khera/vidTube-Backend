import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// configure cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
		    // if localFilePath doesn't exist return null
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath, {
		            // upload options
                resource_type: "auto"
            }
        )
        // File has been successfully uploaded
        console.log("File uploaded on cloudinary. File src: ", response.url);
        // once the file is uploaded we would like to delete it from our server
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        // remove the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null
    }
}

export { uploadOnCloudinary }
