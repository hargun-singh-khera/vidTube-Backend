import mongoose, {isValidObjectId, Mongoose} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const videos = await Video.find({})
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "All Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!title && !description) {
        throw new ApiError(400, "Title and description is requried")
    }
    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoFileLocalPath && !thumbnailLocalPath) {
        throw new ApiError(400, "Video with Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile && !thumbnail) {
        throw new ApiError(400, "Video file and Thumbnail is required for cloudinary upload")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        views: videoFile.views,
        owner: req.user?._id
    })

    const generatedVideo = await Video.findById(video._id)
    if(!generatedVideo) {
        throw new ApiError(500, "Something went wrong while uploading the video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, generatedVideo, "Video Uploaded Successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId) {
        throw new ApiError(400, "Video ID is required")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(500, "Something went wrong while fetching the video")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId) {
        throw new ApiError(400, "Video ID is required")
    }
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body
    if(!title && !description) {
        throw new ApiError(400, "Title and description is requried")
    }
    const thumbnailLocalPath = req.file?.path
    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail.url) {
        throw new ApiError(400, "Error while uploading thumbnail")
    }
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        {new: true}
    )
    if(!video) {
        throw new ApiError(500, "Something went wrong while updating video details")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video details updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId) {
        throw new ApiError(400, "Video ID is required")
    }
    const video = await Video.findByIdAndDelete(videoId)
    if(!video) {
        throw new ApiError(500, "Something went wrong while deleting the video")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId) {
        throw new ApiError(400, "Video ID is required")
    }
    const video = await Video.findById(videoId)
    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })

    if(!video) {
        throw new ApiError(500, "Something went wrong while changing the publish status")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video publish status changed successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}