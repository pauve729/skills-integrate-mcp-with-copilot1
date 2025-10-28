document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userGreeting = document.getElementById("user-greeting");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLogin = document.getElementById("close-login");
  const profileSection = document.getElementById("profile-section");
  const profileInfo = document.getElementById("profile-info");

  let currentUser = null;

  // Fetch current user profile
  async function fetchProfile() {
    try {
      const res = await fetch("/profile");
      if (res.ok) {
        const user = await res.json();
        currentUser = user;
        userGreeting.textContent = `Hello, ${user.name} (${user.role})`;
        userGreeting.classList.remove("hidden");
        loginBtn.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
        // Show profile info
        profileSection.classList.remove("hidden");
        profileInfo.innerHTML = `<b>Email:</b> ${user.email}<br><b>Name:</b> ${user.name}<br><b>Role:</b> ${user.role}`;
      } else {
        currentUser = null;
        userGreeting.classList.add("hidden");
        loginBtn.classList.remove("hidden");
        logoutBtn.classList.add("hidden");
        profileSection.classList.add("hidden");
        profileInfo.innerHTML = "";
      }
    } catch {
      currentUser = null;
      userGreeting.classList.add("hidden");
      loginBtn.classList.remove("hidden");
      logoutBtn.classList.add("hidden");
      profileSection.classList.add("hidden");
      profileInfo.innerHTML = "";
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        const spotsLeft = details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;
        activitiesList.appendChild(activityCard);
        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE", credentials: "include" }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST", credentials: "include" }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Login modal logic
  loginBtn.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
  });
  closeLogin.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      const res = await fetch("/login", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const result = await res.json();
      if (res.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        loginModal.classList.add("hidden");
        fetchProfile();
      } else {
        messageDiv.textContent = result.detail || "Login failed";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch (err) {
      messageDiv.textContent = "Login error. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/logout", { method: "POST", credentials: "include" });
      if (res.ok) {
        messageDiv.textContent = "Logged out.";
        messageDiv.className = "success";
        fetchProfile();
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch {
      messageDiv.textContent = "Logout error.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Initial load
  fetchProfile().then(fetchActivities);
});
