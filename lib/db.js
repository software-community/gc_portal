import mongoose, { mongo } from 'mongoose'
const { ObjectId } = mongo

mongoose.connect('mongodb://localhost:27017/GC_tracker')
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Error connecting to MongoDB:", err))

const GC_Schema = new mongoose.Schema({
    AY: { type: String, required: true },
    contractAddress: { type: String, required: true },
    active:{type:Boolean, default:true}
})
const Contest_Schema = new mongoose.Schema({
    name: { type: String, required: true },
    leg: { type: String, enum: ["Tech", "Sports", "Cult", "Literature"] },
    startTime: { type: Date, required: true },
    duration: { type: Number },//minutes
    details: { type: Text, required: true },
    GC: ObjectId,
    verified: { type: Boolean, default: false },
    points_distribution:{type:String,default:false}
})

const Hostel_Schema = new mongoose.Schema({
    name: { type: String, required: true },
    year_added:{type:String,required:true},
    year_removed:{type:String,required:true},

})

const GC = mongoose.model('GC', GC_Schema);
const Contest = mongoose.model('Contest', Contest_Schema);
const Hostel = mongoose.model('Hostel', Hostel_Schema)

const db = {
    GC: {
        add: async (AY, cAddr) => {
            const gc = new GC({ AY: AY, contractAddress: cAddr });
            return await gc.save()
        },
        deactivate: async (AY) => {
            return await GC.findOneAndUpdate({ AY },{$set:{active:true}});
        },
        get: async (AY) => {
            return await GC.find({ AY });
        },
    },
    hostel: {
        add: async (name,year_added) => { (new Hostel({ name,year_added })).save() },
        delete: async (name,year_removed) => { return await GC.findOneAndUpdate({ name },{$set:{year_removed}}) },
        get: async query => { return await GC.find(query) }
    },
    contest: {
        add: async (data) => {
            const contest = new Contest(data);
            return await contest.save();
        },
        update: async (id, update) => {
            update.verified = false;
            return await Contest.findByIdAndUpdate(id, { $set: update });
        },
        remove: async query => {
            query.verified = true; await Contest.deleteMany(query)
        },
        get: async query => {
            query.verified = true; 
            return await Contest.findMany(query)
        },
        verify: async query => await Contest.updateMany(query, { $set: { verified: true } }),
        add_score_dist: async (id,dist)=>await Contest.findByIdAndUpdate(id, {$set:{points_distribution:dist}})
    }
};

export default db;
