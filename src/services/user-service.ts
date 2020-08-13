import { User } from "../models/User";
import { saveProfilePicture } from "../daos/Cloud-Storage/user-images";
import { bucketBaseUrl } from "../daos/Cloud-Storage";
import { expressEventEmitter, customExpressEvents } from "../event-listeners";
import { getAllUsers, findUsersById, saveNewUser, getUserByUsernameAndPassword, updateUser } from "../daos/SQL/users-dao";
import { logger, errorLogger } from "../utilities/loggers";

//the most basic service function you will see (all it does is call the dao)
//its easier to expand a function that already exists instead of inserting a new function in to the mix
//(easier to edit it later)
export async function getAllUsersService(): Promise<User[]> {
    return await getAllUsers()
} //not currently actually using this, just an example

export async function getUserByIDService(id: number): Promise<User> {
    return await findUsersById(id)
}

export async function getUserByUserNameAndPasswordService(username:string, password:string): Promise<User> {
    return await getUserByUsernameAndPassword(username, password)
}

export async function saveNewUserService(newUser: User): Promise<User> {
    //two major process to manage in this function
    try {
        //if (newUser.image) { //avoid splitting a void string! see if we need this
            let base64Image = newUser.image
            let [dataType, imageBase64Data] = base64Image.split(';base64,')// gets us the two important parts of the base 64 string
            //we need to make sure picture is in the right format
            let contentType = dataType.split('/').pop()
            //then the pop method gets us the last thing in the array
            let date = Date.now() 
            //get the date to make each image save uniquely
        if (newUser.image) {
            newUser.image = `${bucketBaseUrl}/LOTR_Profiles/${newUser.username}/${date}.${contentType}`
        } //set the newUser.image if it exists
        //save new user to database
        let savedUser = await saveNewUser(newUser)

        //save a picture to cloud storage 
        await saveProfilePicture(contentType, imageBase64Data, `LOTR_Profiles/${newUser.username}/${date}.${contentType}`)

        console.log(`in the service ${savedUser}`);
        
        expressEventEmitter.emit(customExpressEvents.NEW_USER, newUser)
        //with event driven design after I completed the save a user process
        //send an event saying tis done with the relevent info
        // (aka) send an event with relevant info, telling us we are done saving new user (only to internal server pieces)
        return savedUser
    } catch (e) {
        errorLogger.error(e);
        logger.error(e)
        throw e
    }
    //if we can't save the user in the db, don't save the picture
    //if we do save the user and the picture save fails - pretend that nothing happened ( you should probably update the user to set the image to null)
}

export async function updateUserService(updatedUser: User): Promise<User>{
    try {
        let date = Date.now() //for saving the image uniquely

        let savedUser = undefined
        if (updatedUser.image) {
            //essentially the above, but we are switching the dao fucntion and the input
            let base64Image = updatedUser.image
            let [dataType, imageBase64Data] = base64Image.split(';base64,')
            let contentType = dataType.split('/').pop()
            
            //log what we're doing
            let userInfo = await findUsersById(updatedUser.userId)
            logger.info(`Start Changing ${userInfo.username} profile information`)

            updatedUser.image = `${bucketBaseUrl}/LOTR_Profiles/${updatedUser.username}/${date}.${contentType}`
            savedUser = await updateUser(updatedUser)
            await saveProfilePicture(contentType, imageBase64Data, `LOTR_Profiles/${updatedUser.username}/${date}.${contentType}`)
        } else { //updating without image
            savedUser = await updateUser(updatedUser)
        }
        logger.info(updatedUser); //not sure if we want this
        expressEventEmitter.emit(customExpressEvents.UPDATED_USER, updatedUser)
        return savedUser
    } catch (e) {
        errorLogger.error(e);
        logger.error(e)
        throw e
    }   
}