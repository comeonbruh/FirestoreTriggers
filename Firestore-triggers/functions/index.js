const functions = require("firebase-functions");
const admin  = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
//create trigger
//Line 10 ---Referencing the users collection with the userId which we can grab it.
//Once a user field is entered manually, wait for a sec or two till the trigger fires and it creates a logging collection with the description.
exports.onUserCreate = functions.firestore.document('users/{userId}').onCreate( async(snap,context) => {
    const values = snap.data();
    //sending email notification(can send a push notification also)
    //referencing the loggin table
    await db.collection('logging').add({description: `Email was sent to user with username:${values.username}`});
})

//Create two collections like users and reviews and when someones username is updated in the users collection it should be updated in the reviews collection too.
//update trigger
exports.onUserUpdate = functions.firestore.document('users/{userId}').onUpdate( async(snap,context) => {
    const newValues = snap.after.data();
    const previousValues = snap.before.data();
    if(newValues.username != previousValues.username){
        const snapshot = await db.collection('reviews').where('username', '==',previousValues.username).get();
        let updatePromises = [];
        snapshot.forEach(doc => {
            updatePromises.push(db.collection('reviews').doc(doc.id).update({username: newValues.username }))
        }); 
        await Promise.all(updatePromises);
    }
})

//delete trigger
exports.onPostDelete = functions.firestore.document('post/{postId}').onDelete(async (snap,context)=>{
    const deletedPost = snap.data();
    let deletePromises = [];
    const bucket = admin.storage().bucket();
    deletedPost.images.forEach(image => {
        deletePromises.push(bucket.file(image).delete());
    });
    await Promise.all(deletePromises)
})
