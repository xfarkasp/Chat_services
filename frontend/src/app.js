let user = null;
let ws = null;

// Login function
async function loginUser() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      user = data.user;
      document.getElementById("usernameDisplay").innerText = user.username;
      document.getElementById("login").style.display = "none";
      document.getElementById("chat").style.display = "block";
      document.getElementById("groupChat").style.display = "block";

      // Open WebSocket connection after successful login
      connectWebSocket(data.user.id, data.token);

      await requestNotificationPermission();

      // Fetch the user's message history after login
      await retrieveMessageHistory(user.id, data.token);
    } else {
      alert(data.error || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
  }
}

// Register function
async function register() {
  const email = document.getElementById("emailRegister").value;
  const password = document.getElementById("passwordRegister").value;
  const username = document.getElementById("username").value;

  try {
    const response = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful!");
      document.getElementById("register").style.display = "none"; // Hide the registration form
      document.getElementById("login").style.display = "block"; // Show the login form
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (error) {
    console.error("Registration error:", error);
  }
}

async function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    try {
      await Notification.requestPermission();
    } catch (err) {
      console.error("Notification permission error:", err);
    }
  }
}

// Toggle to show the registration form
function showRegisterForm() {
  document.getElementById("login").style.display = "none"; // Hide login
  document.getElementById("register").style.display = "block"; // Show register
}

// Toggle to show the login form
function showLoginForm() {
  document.getElementById("register").style.display = "none"; // Hide register
  document.getElementById("login").style.display = "block"; // Show login
}

// Retrieve message history after successful login
async function retrieveMessageHistory(userId, token) {
  try {
    const response = await fetch(`/api/chat/messages/${userId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,  // Pass the token in the Authorization header
      },
    });

    const data = await response.json();

    if (response.ok) {
      data.forEach((message) => {
        displayMessage(message.sender_id, message.content, message.sender_id === userId ? "outgoing" : "incoming");
      });
    } else {
      console.error("Failed to retrieve messages:", data.error);
    }
  } catch (error) {
    console.error("Error fetching message history:", error);
  }
}

// Connect to WebSocket server
function connectWebSocket(userId, token) {
  ws = new WebSocket("wss://frontend/ws");

  ws.onopen = () => {
    console.log("Connected to WebSocket server");
    // Register session after connection
    ws.send(JSON.stringify({ type: "register", user_id: userId, token }));
  };

  function showBrowserNotification(title, body) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }

  ws.onmessage = (event) => {
    const messageData = JSON.parse(event.data);
    console.log("WebSocket received message:", messageData);
    displayMessage(messageData.sender_id, messageData.content, "incoming", messageData.media_url);
    if (messageData.type === "private-message") {
      console.log("private message recieved");
      displayMessage(messageData.sender_id, messageData.content, "incoming", messageData.media_url);
    } else if (messageData.type === "group-message") {
      displayGroupMessage(messageData.sender_id, messageData.content, "incoming", messageData.media_url);
    } else  if (messageData.type === "undelivered") {
      messageData.messages.forEach((msg) => {
        showBrowserNotification("Missed Message", msg.content);
      });
    }

    if (Notification.permission === "granted") {
      const notification = new Notification("New message", {
        body: messageData.content,
      });
  
      notification.onclick = () => {
        window.focus();
      };
    }
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
  };
}

async function sendMessage() {
  const receiverId = document.getElementById("receiverId").value;
  const content = document.getElementById("messageInput").value;
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  console.log("User before sending:", user);
  if (!user || !user.id) {
    alert("User is not logged in or user ID is missing.");
    return;
  }

  if (!receiverId || (!content && !file)) {
    alert("Please provide a message or select a file to send.");
    return;
  }

  const formData = new FormData();
  formData.append("sender_id", user.id);
  formData.append("receiver_id", receiverId);
  formData.append("content", content);

  if (file) {
    formData.append("file", file);
  }

  console.log("FormData values before sending:");
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]); // Logs key-value pairs
  }

  try {
    const response = await fetch("/api/chat/send-message", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      displayMessage(user.id, content, "outgoing", data.media_url);
      document.getElementById("messageInput").value = "";
      clearFilePreview(); // Remove preview after sending
    } else {
      alert(data.error || "Message sending failed");
    }
  } catch (error) {
    console.error("Message sending error:", error);
  }
}

function displayMessage(senderId, content, type, mediaUrl = null) {
  const messageBox = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", type);

  if (content) {
    const textElement = document.createElement("p");
    textElement.innerText = `${type === "incoming" ? `From ${senderId}: ` : ""}${content}`;
    messageElement.appendChild(textElement);
  }

  if (mediaUrl) {
    const mediaContainer = document.createElement("div");

    const cleanUrl = mediaUrl.split('?')[0];
    const fileExtension = cleanUrl.split('.').pop().toLowerCase();

    if (["jpeg", "jpg", "png", "gif", "webp"].includes(fileExtension)) {
      const img = document.createElement("img");
      img.src = mediaUrl;
      img.alt = "Sent image";
      img.style.maxWidth = "200px";
      mediaContainer.appendChild(img);
    } else if (["mp4", "webm", "ogg"].includes(fileExtension)) {
      const video = document.createElement("video");
      video.src = mediaUrl;
      video.controls = true;
      video.style.maxWidth = "300px";
      mediaContainer.appendChild(video);
    } else if (["mp3", "wav", "ogg"].includes(fileExtension)) {
      const audio = document.createElement("audio");
      audio.src = mediaUrl;
      audio.controls = true;
      mediaContainer.appendChild(audio);
    } else {
      const link = document.createElement("a");
      link.href = mediaUrl;
      link.innerText = "Download File";
      link.target = "_blank";
      mediaContainer.appendChild(link);
    }

    messageElement.appendChild(mediaContainer);
  } else {
    console.warn("No media URL received for message:", content);
  }

  messageBox.appendChild(messageElement);
  messageBox.scrollTop = messageBox.scrollHeight;
}

async function createGroup() {
  const groupName = document.getElementById("groupName").value;

  if (!groupName) {
    alert("Please enter a group name.");
    return;
  }

  try {
    const response = await fetch("/api/groups/create_group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName, owner_id: user.id }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(`Group '${groupName}' created!`);
    } else {
      alert(data.error || "Failed to create group.");
    }
  } catch (error) {
    console.error("Group creation error:", error);
  }
}

async function joinGroup() {
  const groupId = document.getElementById("groupIdJoin").value;

  if (!groupId) {
    alert("Please provide a group ID");
    return;
  }

  try {
    const response = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, group_id: groupId }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Joined Group Successfully!");
    } else {
      alert(data.error || "Failed to join group");
    }
  } catch (error) {
    console.error("Error joining group:", error);
  }
}

async function sendGroupMessage() {
  const groupId = document.getElementById("groupIdMessage").value;
  const content = document.getElementById("groupMessageInput").value;

  if (!groupId || !content) {
    alert("Please provide a group ID and a message");
    return;
  }

  try {
    await fetch(`/api/groups/${groupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_id: user.id, content }),
    });

    displayGroupMessage(user.id, content, "outgoing");
    document.getElementById("groupMessageInput").value = "";
  } catch (error) {
    console.error("Error sending group message:", error);
  }
}

function displayGroupMessage(senderId, content, type) {
  const messageBox = document.getElementById("groupMessages");
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", type);
  messageElement.innerText = `${type === "incoming" ? `From ${senderId}: ` : ""}${content}`;
  messageBox.appendChild(messageElement);

  messageBox.scrollTop = messageBox.scrollHeight;
}

function previewFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) return;

  const previewContainer = document.getElementById("filePreviewContainer");
  const imagePreview = document.getElementById("imagePreview");
  const videoPreview = document.getElementById("videoPreview");
  const filePreview = document.getElementById("filePreview");

  // Hide all previews initially
  imagePreview.style.display = "none";
  videoPreview.style.display = "none";
  filePreview.style.display = "none";

  // Show preview container
  previewContainer.style.display = "block";

  const fileURL = URL.createObjectURL(file);

  // Determine file type and show appropriate preview
  if (file.type.startsWith("image/")) {
    imagePreview.src = fileURL;
    imagePreview.style.display = "block";
  } else if (file.type.startsWith("video/")) {
    videoPreview.src = fileURL;
    videoPreview.style.display = "block";
  } else {
    filePreview.href = fileURL;
    filePreview.innerText = `Attached: ${file.name}`;
    filePreview.style.display = "block";
  }
}

// Remove file preview
function clearFilePreview() {
  document.getElementById("fileInput").value = "";
  document.getElementById("filePreviewContainer").style.display = "none";
}

window.loginUser = loginUser;
window.register = register;
window.sendMessage = sendMessage;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.createGroup = createGroup;
window.joinGroup = joinGroup;
window.sendGroupMessage = sendGroupMessage;
window.previewFile = previewFile;
window.clearFilePreview = clearFilePreview;
