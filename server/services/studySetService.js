import StudySet from '../models/StudySet.js';

export const studySetService = {
  getAllStudySets: async () => {
    return await StudySet.find().sort({ createdAt: -1 });
  },

  getStudySetById: async (id) => {
    return await StudySet.findById(id);
  },

  createStudySet: async (data) => {
    const studySet = new StudySet(data);
    return await studySet.save();
  },

  updateStudySet: async (id, data) => {
    return await StudySet.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteStudySet: async (id) => {
    return await StudySet.findByIdAndDelete(id);
  }
};
