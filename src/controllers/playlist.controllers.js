import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name && !description) {
        throw new ApiError(400, "Name and description are required")
    }
    const generatePlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })
    const playlist = await Playlist.findById(generatePlaylist._id)
    if(!playlist) {
        throw new ApiError(500, "Failed to create playlist")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"))
}) 

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const playlists = await Playlist.find({owner: userId})
    if(!playlists) {
        throw new ApiError(404, "No playlists found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist = await Playlist.findByIdAndDelete(playlistId) 
    if(!playlist) {
        throw new ApiError(404, "Unable to delete playlist which does not exist")
    }
    return res 
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!name && !description) {
        throw new ApiError(400, "Name and description are required")
    }
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {name, description}
        },
        {new: true}
    )
    if(!playlist) {
        throw new ApiError(500, "Failed to update playlist")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}