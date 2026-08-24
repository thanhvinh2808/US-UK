import Topic from '../models/Topic.js';

export const topicService = {
  getAllTopics: async () => {
    return await Topic.find().sort({ createdAt: -1 });
  },

  getTopicById: async (id) => {
    return await Topic.findOne({
      $or: [
        { slugId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });
  },

  createTopic: async (data) => {
    const newTopic = new Topic(data);
    return await newTopic.save();
  },

  updateTopic: async (id, data) => {
    return await Topic.findOneAndUpdate(
      {
        $or: [
          { slugId: id },
          ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
        ]
      },
      data,
      { new: true, runValidators: true }
    );
  },

  deleteTopic: async (id) => {
    return await Topic.findOneAndDelete({
      $or: [
        { slugId: id },
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])
      ]
    });
  }
};
