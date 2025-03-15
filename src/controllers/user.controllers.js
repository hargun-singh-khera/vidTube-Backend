import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js" 
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        // Find user by id for generating the token for it
        const user = await User.findById(userId)
        // Generate access and refresh tokens for the user
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        // save refresh token in the user database
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens.")
    }
}

const registerUser = asyncHandler( async(req, res) => {
    const { username, email, fullname, password } = req.body;
    console.log("req.body: ", req.body);

    // Check if all required fields are present
    if([username, email, fullname, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    // Check if user already exists with given email or username
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    console.log("req.files: ", req.files);
    
    // Extract avatar and cover image paths from request files object
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // Avatar file is required for cloudinary upload
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // Upload avatar and cover image to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    console.log("Uploaded Files Cloudinary:", avatar);

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required for cloudinary upload")
    }

    // Create a new user in the database
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    // Fetch the created user from the database and exclude password and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler( async(req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token generate
    // send cookie

    const { username, email, password } = req.body

		// if none of username and email is provided, atleast one is required
    if(!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }

    // This is alternative way to handle the same logic
    // if(!(username || email)) {
    //     throw new ApiError(400, "Username or email is required")
    // }

    // Find user by username or email
    const user = await User.findOne({
        $or: [ { username }, { email }]
    })

    if(!user) {
        throw new ApiError(404, "User does not exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    // Validate password
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials!")
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // Remove sensitive info before sending response, getting user reference for sending tokens in cookie
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!loggedInUser) {
        throw new ApiError(500, "Something went wrong while logging in the user")
    }

    // Cookie settings for security
    const options = {
        httpOnly: true,  // Prevents JavaScript access to cookies
        secure: true     // Ensures cookies are sent over HTTPS
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler( async(req, res) => {
    // Clear refresh token from user database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1    // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
       .status(200)
       .clearCookie("accessToken", options)
       .clearCookie("refreshToken", options)
       .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    // access refresh token from cookies
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    } 
    
    try {
        // verify and decode refresh token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        // fetch user from database using decoded token payload
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        // user.refreshToken is a string stored in db
        // The refresh token from the request matches the one stored in the database.
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token has expired or is invalid")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
		    // for generating new access and refresh token
        const { accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(
                    new ApiResponse(
                        200, 
                        {accessToken, newRefreshToken},
                        "Access token refreshed successfully"
                    )
                )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const { oldPassword, newPassword } = req.body
    // also for taking confirm password
    // const { oldPassword, newPassword, confirmPassword } = req.body
    // if(!(newPassword === confirmPassword)) {
    //     throw new ApiError(400, "Passwords do not match")
    // }

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const { fullname, email } = req.body
    if(!fullname && !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullname, email }
        },
        {new: true}  // return updated document
    ).select("-password")
    
    return res  
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    // TODO: delete old image - assignment
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url }
        },
        {new: true}
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar Image updated successfully."))

})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImage.url }
        },
        {new: true}
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully."))

})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
