document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Replace the current activity cards and dropdown options.
      activitiesList.innerHTML = "";
      [...activitySelect.options].slice(1).forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        let spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability-count">${spotsLeft} spots left</span></p>
        `;

        const availabilityCount = activityCard.querySelector(".availability-count");
        const participantsHeading = document.createElement("h5");
        participantsHeading.className = "participants-heading";
        participantsHeading.textContent = "Participants";

        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";

        if (details.participants.length > 0) {
          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";
            participantItem.dataset.email = participant;

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.className = "participant-remove";
            removeButton.type = "button";
            removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            removeButton.title = "Unregister participant";
            removeButton.innerHTML = `
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
              </svg>
            `;

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Unable to unregister participant");
                }

                participantsList.querySelectorAll(".participant-item").forEach((item) => {
                  if (item.dataset.email === participant) {
                    item.remove();
                  }
                });
                details.participants = details.participants.filter((email) => email !== participant);
                spotsLeft += result.removed_count;
                availabilityCount.textContent = `${spotsLeft} spots left`;

                if (participantsList.children.length === 0) {
                  const emptyMessage = document.createElement("li");
                  emptyMessage.className = "participant-list-empty";
                  emptyMessage.textContent = "No participants yet";
                  participantsList.appendChild(emptyMessage);
                }
              } catch (error) {
                messageDiv.textContent = error.message || "Failed to unregister participant.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering participant:", error);
                if (removeButton.isConnected) {
                  removeButton.disabled = false;
                }
              }
            });

            participantItem.append(participantEmail, removeButton);
            participantsList.appendChild(participantItem);
          });
        } else {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "participant-list-empty";
          emptyMessage.textContent = "No participants yet";
          participantsList.appendChild(emptyMessage);
        }

        activityCard.append(participantsHeading, participantsList);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
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
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
