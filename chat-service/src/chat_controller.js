const axios = require("axios");
const FormData = require("form-data");
const stream = require("stream");
const pool = require("./db");
const { producer } = require("./kafka_producer");

const multimedia_service_url =
  process.env.MULTIMEDIA_SERVICE_URL || "http://multimedia-service:3001";

//-------------------------------------------------------------------------------------------------------------

async function sendMessage({
  sender_id,
  receiver_id,
  group_id,
  content,
  messageType,
  mediaBuffer,
  mediaFileName,
  mediaMimeType,
  media_url,
}) {
  let mediaUrl = null;

  if (mediaBuffer && mediaFileName && mediaMimeType) {
    const formData = new FormData();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(mediaBuffer);

    formData.append("file", bufferStream, {
      filename: mediaFileName,
      contentType: mediaMimeType,
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
  } else {
    console.log(media_url);
    mediaUrl = media_url;
  }

  const string_receiver_id = String(receiver_id);

  await producer.send({
    topic: "chat-messages",
    messages: [
      {
        key: string_receiver_id,
        value: JSON.stringify({
          sender_id,
          group_id,
          receiver_id: string_receiver_id,
          content,
          messageType,
          media_url: mediaUrl,
        }),
      },
    ],
  });

  return mediaUrl;
}

//-------------------------------------------------------------------------------------------------------------

async function sendDirectMessage(req, res) {
  const { sender_id, receiver_id, content } = req.body;

  if (!sender_id || !receiver_id || (!content && !req.file)) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const media_url = await sendMessage({
      sender_id,
      receiver_id,
      content,
      messageType: "direct",
      mediaBuffer: req.file?.buffer,
      mediaFileName: req.file?.originalname,
      mediaMimeType: req.file?.mimetype,
    });

    res
      .status(200)
      .json({ message: "Message sent successfully", media_url: media_url });

    await pool.query(
      "INSERT INTO messages (sender_id, receiver_id, content, media_url) VALUES ($1, $2, $3, $4)",
      [sender_id, receiver_id, content, media_url]
    );
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

//-------------------------------------------------------------------------------------------------------------

async function getMessageHistory(req, res) {
  const user_id = parseInt(req.params.user_id, 10);

  if (isNaN(user_id)) {
    return res.status(400).json({ error: "Invalid user ID format." });
  }

  // if (user_id !== req.user.id) {
  //   return res
  //     .status(403)
  //     .json({ error: "Access denied. This is not your data." });
  // }

  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT * FROM messages
         WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)
         ORDER BY timestamp DESC
         LIMIT 10
       ) sub
       ORDER BY timestamp ASC`,
      [user_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No messages found for this user." });
    }

    for (let msg of result.rows) {
      if (msg.media_file) {
        try {
          const response = await axios.get(
            `${multimedia_service_url}/api/media/download/${msg.media_file}`
          );
          msg.media_url = response.data.url;
        } catch (error) {
          console.error("Error fetching media URL:", error);
        }
      }
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

//-------------------------------------------------------------------------------------------------------------

async function getConversations(req, res) {
  const currentUserId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT u.id, u.username
      FROM (
        SELECT DISTINCT
          CASE
           WHEN sender_id = $1 THEN receiver_id
            ELSE sender_id
          END AS partner_id
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
      ) AS conv
      JOIN users u ON u.id = conv.partner_id
      ORDER BY u.username ASC;
      `,
      [currentUserId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
}

//-------------------------------------------------------------------------------------------------------------

module.exports = {
  sendMessage,
  sendDirectMessage,
  getMessageHistory,
  getConversations,
};
