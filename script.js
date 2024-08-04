document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chargingForm');
  const statusSection = document.getElementById('charging-status');
  const endSessionButton = document.getElementById('endSessionButton');
  const chargingPieChartCtx = document.getElementById('chargingPieChart').getContext('2d');
  const chargingCompleteNotification = document.getElementById('chargingCompleteNotification');

  // Initialize Chart.js with animation
  const chargingPieChart = new Chart(chargingPieChartCtx, {
      type: 'pie',
      data: {
          labels: [], // Vehicle IDs or names
          datasets: [{
              label: 'Charging Data',
              data: [], // Amount of charging
              backgroundColor: [], // Unique color for each section
              borderColor: '#fff',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: {
                  position: 'top',
              },
              tooltip: {
                  callbacks: {
                      label: function(tooltipItem) {
                          return `${tooltipItem.label}: KES ${tooltipItem.raw}`;
                      }
                  }
              }
          },
          animation: {
              duration: 800, // Duration of the animation
              easing: 'easeInOutQuad'
          },
          layout: {
              padding: {
                  top: 20,
                  bottom: 20
              }
          }
      }
  });

  // Retrieve or initialize vehicle colors from localStorage
  const vehicleColors = JSON.parse(localStorage.getItem('vehicleColors')) || {};

  function updatePieChart(vehicleId, chargingAmountKES) {
      const chartLabels = chargingPieChart.data.labels;
      const chartData = chargingPieChart.data.datasets[0].data;
      const chartColors = chargingPieChart.data.datasets[0].backgroundColor;

      // Check if the vehicleId already exists in the chart
      const labelIndex = chartLabels.indexOf(vehicleId);

      if (labelIndex === -1) {
          // New vehicle ID, add it to the chart
          chartLabels.push(vehicleId);
          chartData.push(chargingAmountKES);

          // Assign a color if not already assigned
          if (!vehicleColors[vehicleId]) {
              vehicleColors[vehicleId] = getRandomColor();
              localStorage.setItem('vehicleColors', JSON.stringify(vehicleColors));
          }
          chartColors.push(vehicleColors[vehicleId]);
      } else {
          // Existing vehicle ID, update its data
          chartData[labelIndex] = chargingAmountKES;
      }

      chargingPieChart.update();
  }

  function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
  }

  // Check for existing session data
  const storedSession = JSON.parse(localStorage.getItem('chargingSession'));

  if (storedSession) {
      // Restore session data if available
      updateChargingStatus(storedSession);
      startChargingProgress(storedSession.chargingDuration);
      statusSection.classList.remove('hidden');
      updatePieChart(storedSession.vehicleId, storedSession.chargingAmountKES);
  }

  form.addEventListener('submit', handleFormSubmit);
  endSessionButton.addEventListener('click', endSession);

  function handleFormSubmit(event) {
      event.preventDefault();

      // Check if a session is already active
      const activeSession = JSON.parse(localStorage.getItem('chargingSession'));
      if (activeSession) {
          showNotification('An active charging session is already in progress. Please end the current session before starting a new one.');
          return;
      }

      const vehicleId = document.getElementById('vehicleId').value;
      const chargingAmount = parseFloat(document.getElementById('chargingAmount').value) || 0;

      // Validate Vehicle ID
      const vehicleIdPattern = /^[A-Z]{3}[0-9]{3}$/;
      if (!vehicleIdPattern.test(vehicleId)) {
          showNotification('Invalid Vehicle ID format. Please enter three uppercase letters followed by three numbers.');
          return;
      }

      // Validate Charging Amount
      if (chargingAmount <= 0) {
          showNotification('Charging amount must be greater than zero.');
          return;
      }

      const chargingDuration = 10; // Simulate a 10-second charging duration

      // Store session data
      const sessionData = {
          vehicleId: vehicleId,
          chargingAmountKES: chargingAmount,
          chargingDuration: chargingDuration,
          startTime: new Date().toISOString()
      };

      localStorage.setItem('chargingSession', JSON.stringify(sessionData));
      updateChargingStatus(sessionData);
      startChargingProgress(chargingDuration);

      statusSection.classList.remove('hidden');
      updatePieChart(vehicleId, chargingAmount);
  }

  function startChargingProgress(duration) {
      const progressBar = document.getElementById('progressBar');
      const timeRemaining = document.getElementById('timeRemaining');

      let timeLeft = duration;
      progressBar.value = 0;
      progressBar.max = 100;

      const interval = setInterval(() => {
          timeLeft--;
          progressBar.value = ((duration - timeLeft) / duration) * 100;
          timeRemaining.textContent = `Estimated Time Remaining: ${formatTime(timeLeft)}`;

          if (timeLeft <= 0) {
              clearInterval(interval);
              timeRemaining.textContent = 'Charging Complete';
              showChargingCompleteNotification();
          }
      }, 1000);
  }

  function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateChargingStatus(data) {
      const statusContainer = document.getElementById('statusContainer');
      statusContainer.innerHTML = `
          <p><strong>Vehicle ID:</strong> ${data.vehicleId}</p>
          <p><strong>Charging Amount:</strong> KES ${data.chargingAmountKES}</p>
          <p><strong>Start Time:</strong> ${new Date(data.startTime).toLocaleString()}</p>
      `;
  }

  function showChargingCompleteNotification() {
      chargingCompleteNotification.classList.add('show');
      setTimeout(() => {
          chargingCompleteNotification.classList.remove('show');
      }, 3000); // Notification shows for 3 seconds
  }

  function endSession() {
      // Get current session data
      const activeSession = JSON.parse(localStorage.getItem('chargingSession'));

      if (activeSession) {
          const progressBar = document.getElementById('progressBar');
          const timeRemaining = document.getElementById('timeRemaining');

          // Complete the charging process
          const chargingDuration = activeSession.chargingDuration;
          let timeLeft = (progressBar.max - progressBar.value) / 100 * chargingDuration;

          // Simulate completing the charging
          const completeCharging = setInterval(() => {
              timeLeft--;
              progressBar.value = 100;
              timeRemaining.textContent = 'Charging Complete';

              if (timeLeft <= 0) {
                  clearInterval(completeCharging);
                  resetSession();
              }
          }, 1000);
      }
  }

  function resetSession() {
      localStorage.removeItem('chargingSession');
      document.getElementById('chargingForm').reset();
      document.getElementById('statusContainer').innerHTML = '';
      document.getElementById('progressBar').value = 0;
      document.getElementById('timeRemaining').textContent = 'Estimated Time Remaining: 00:00';
      statusSection.classList.add('hidden');
      showNotification('Charging session ended.');
      chargingCompleteNotification.classList.remove('show'); // Hide the notification when the session ends
  }

  function showNotification(message) {
      const notifications = document.getElementById('notifications');
      notifications.textContent = message;
      notifications.style.display = 'block';
      setTimeout(() => {
          notifications.style.display = 'none';
      }, 3000);
  }
});
