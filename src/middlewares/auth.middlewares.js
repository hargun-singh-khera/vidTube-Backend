import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

// Middleware to verify JWT token
export const verifyJWT = asyncHandler( async(req, _, next) => {
    try {
        // Extract token from cookies or Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        // If no token is found, throw an error
        if(!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        // Verify token and decode data or payload
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // Fetch user from decoded token payload
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        // Check if user exists and is not expired
        if(!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        // Attach user to request object for further use in routes
        req.user = user
        // Move to the next middleware or route handler
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})
