const axios = require("axios");
const FormData = require("form-data");
const stream = require("stream");
const {
  insertGroup,
  insertMember,
  insertMessage,
  fetchMessages,
  fetchMembers,
  fetchAssociatedGroups,
  findGroupInDbById,
  findGroupInDbByName,
} = require("./db");
const { producer } = require("./kafka_producer");

const multimedia_service_url =
  process.env.MULTIMEDIA_SERVICE_URL || "http://multimedia-service:3001";

//-------------------------------------------------------------------------------------------------------------

async function createGroup(req, res) {
  try {
    const { name, owner_id } = req.body;
    if (!name || !owner_id) {
      return res
        .status(400)
        .json({ error: "Group name and owner ID are required" });
    }
    const group = await insertGroup(name, owner_id);
    res.status(201).json({ message: "Group created", group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

//-------------------------------------------------------------------------------------------------------------

async function addMember(req, res) {
  try {
    let { group_id, user_id } = req.body;

    if (!group_id || !user_id) {
      return res
        .status(400)
        .json({ error: "Group ID and User ID are required." });
    }
    await insertMember(group_id, user_id);

    res
      .status(200)
      .json({ message: `User added to group ${group_id}.`, user_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

//-------------------------------------------------------------------------------------------------------------

async function sendMessage(req, res) {
  try {
    const { group_id } = req.params;
    const { sender_id, content } = req.body;
    if (!sender_id || (!content && !req.file)) {
      return res
        .status(400)
        .json({ error: "Sender ID and message content are required" });
    }

    let mediaUrl = null;

    if (req.file?.buffer && req.file?.originalname && req.file?.mimetype) {
      const formData = new FormData();
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file?.buffer);

      formData.append("file", bufferStream, {
        filename: req.file?.originalname,
        contentType: req.file?.mimetype,
      });

      const uploadResponse = await axios.post(
        `${multimedia_service_url}/api/media/upload`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      const fileName = uploadResponse.data.fileName;

      const urlResponse = await axios.get(
        `${multimedia_service_url}/api/media/generate-url/${fileName}`
      );
      mediaUrl = urlResponse.data.fileUrl;
    }

    // Insert the message into the database
    const message = await insertMessage(group_id, sender_id, content, mediaUrl);

    const groupMembersResult = await fetchMembers(group_id);
    // Extract user IDs into an array
    const group_members = groupMembersResult
      .map((row) => row.user_id)
      .filter((id) => id !== Number(sender_id));

    // Publish message to Kafka with group_members included
    await producer.send({
      topic: "group-messages",
      messages: [
        {
          key: group_id,
          value: JSON.stringify({
            sender_id,
            group_id,
            message,
            group_members, // Include group members in the Kafka message
          }),
        },
      ],
    });

    res
      .status(200)
      .json({ message: "Message sent", data: message, media_url: mediaUrl });
  } catch (error) {
    console.error("[sendMessage] Error:", error);
    res.status(500).json({ error: error.message });
  }
}

//-------------------------------------------------------------------------------------------------------------

async function getMessages(req, res) {
  try {
    const { group_id } = req.params;
    const messages = await fetchMessages(group_id);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

//-------------------------------------------------------------------------------------------------------------

async function getGroups(req, res) {
  const currentUserId = req.user.id;

  try {
    const result = await fetchAssociatedGroups(currentUserId);
    res.json(result);
  } catch (err) {
    console.error("Database error:", err); // Add logging
    res.status(500).json({ error: "Failed to load groups" });
  }
}

//-------------------------------------------------------------------------------------------------------------

// Find user by username or id
async function findGroup(req, res) {
  const requestedGroupIdentifier = req.params.identifier;
  if (!requestedGroupIdentifier) {
    return res.status(400).json({ error: "Group identifier not provided." });
  }

  try {
    let group = null;
    if (!isNaN(requestedGroupIdentifier)) {
      group = await findGroupInDbById(Number(requestedGroupIdentifier));
    } else {
      group = await findGroupInDbByName(requestedGroupIdentifier);
    }

    if (!group) {
      return res.status(404).json({ error: "User not found." });
    }

    const foundGroup = {
      id: group.id,
      name: group.name,
    };
    res.status(201).json({ message: "User found", foundGroup });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user." });
  }
}

//-------------------------------------------------------------------------------------------------------------

module.exports = {
  createGroup,
  addMember,
  sendMessage,
  getMessages,
  getGroups,
  findGroup,
};
