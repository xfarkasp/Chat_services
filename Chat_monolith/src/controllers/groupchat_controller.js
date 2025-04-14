const { insertGroup, insertMember, insertMessage, fetchMessages, fetchMembers } = require("../config/groupchat_db");

async function createGroup(req, res) {
  try {
    const { name, owner_id } = req.body;
    if (!name || !owner_id) {
      return res.status(400).json({ error: "Group name and owner ID are required" });
    }
    console.log(owner_id); 
    console.log(typeof owner_id);
    const group = await insertGroup(name, owner_id);
    res.status(201).json({ message: "Group created", group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function addMember(req, res) {
  try {
    console.log(req.body);
    let { group_id, user_id } = req.body;

    if (!group_id || !user_id) {
      return res.status(400).json({ error: "Group ID and User ID are required." });
    }
    await insertMember(group_id, user_id);

    res.status(200).json({ message: `User added to group ${group_id}.`, user_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function sendMessage(req, res) {
  try {
    const { group_id } = req.params;
    const { sender_id, content } = req.body;

    if (!sender_id || !content) {
      return res.status(400).json({ error: "Sender ID and message content are required" });
    }

    console.log(req.params);
    console.log(req.body);

    // Insert the message into the database
    const message = await insertMessage(group_id, sender_id, content);

    const groupMembersResult = await fetchMembers(group_id);
    console.log("Fetched Group Members:", groupMembersResult);
    // Extract user IDs into an array
    const group_members = groupMembersResult.map(row => row.user_id);
   

    // Publish message to Kafka with group_members included
    await producer.send({
      topic: "group-messages",
      messages: [
        {
          key: group_id,
          value: JSON.stringify({
            ...message,
            group_members, // Include group members in the Kafka message
          }),
        },
      ],
    });

    res.status(201).json({ message: "Message sent", data: message });
  } catch (error) {
    console.error("[sendMessage] Error:", error);
    res.status(500).json({ error: error.message });
  }
}


async function getMessages(req, res) {
  try {
    const { group_id } = req.params;
    const messages = await fetchMessages(group_id);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { createGroup, addMember, sendMessage, getMessages };
