// --- Admin User Management Script ---

document.addEventListener('DOMContentLoaded', () => {
	
  let activeRoomsCache = [];
  const podiumViewToggles = {};

  // --- Live Monitoring Initialization ---
  if (typeof socket !== 'undefined') {
    socket.emit('join_admin_monitor');
    socket.on('admin_rooms_update', (rooms) => {
      renderAdminRooms(rooms);
    });
  }

  function renderAdminRooms(rooms) {
    activeRoomsCache = rooms || [];
    const grid = document.getElementById('admin-live-rooms-grid');
    const activeCountEl = document.getElementById('admin-active-rooms-count');
    const totalStudentsEl = document.getElementById('admin-total-students-count');
    
    if (!grid || !activeCountEl || !totalStudentsEl) return;

    activeCountEl.textContent = rooms.length;
    let totalStudents = rooms.reduce((sum, r) => sum + (r.studentCount || 0), 0);
    totalStudentsEl.textContent = totalStudents;

    if (rooms.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #666; padding: 20px;">No live quiz sessions currently running.</div>`;
      return;
    }

    grid.innerHTML = rooms.map(room => {
      const isEnded = room.status === 'ended';
      const topLeaderboard = room.leaderboard || [];
      
      if (isEnded && podiumViewToggles[room.roomId] === undefined) {
        podiumViewToggles[room.roomId] = true;
      }

      let leaderboardHtml = '';
      if (topLeaderboard.length === 0) {
        leaderboardHtml = `<div style="font-size: 12px; color: #888; font-style: italic; padding: 5px 0;">No scores yet</div>`;
      } else if (isEnded && podiumViewToggles[room.roomId]) {
        // 🏆 INLINE CARD PODIUM FORMAT
        const first = topLeaderboard[0] || { name: 'N/A', score: 0, totalTime: 0 };
        const second = topLeaderboard[1] || { name: 'N/A', score: 0, totalTime: 0 };
        const third = topLeaderboard[2] || { name: 'N/A', score: 0, totalTime: 0 };

        leaderboardHtml = `
          <div style="background: linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95)); border: 1px solid rgba(250, 204, 21, 0.4); padding: 12px; border-radius: 8px; text-align: center; color: white; margin-top: 5px;">
            <div style="font-size: 12px; font-weight: bold; color: #facc15; margin-bottom: 8px;">🏆 Quiz Winners Podium</div>
            
            <!-- Mini Podiums -->
            <div style="display: flex; justify-content: center; align-items: flex-end; gap: 8px; margin-bottom: 10px;">
              <!-- 2nd Place -->
              <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 6px; border-radius: 6px; width: 30%;">
                <div style="font-size: 14px;">🥈</div>
                <div style="font-size: 10px; font-weight: bold; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${second.name}</div>
                <div style="font-size: 11px; font-weight: bold; color: #4ade80;">${second.score}p</div>
              </div>
              <!-- 1st Place -->
              <div style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(168, 85, 247, 0.2)); border: 1px solid #facc15; padding: 8px; border-radius: 8px; width: 36%; transform: translateY(-4px);">
                <div style="font-size: 16px;">👑</div>
                <div style="font-size: 11px; font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${first.name}</div>
                <div style="font-size: 12px; font-weight: bold; color: #facc15;">${first.score}p</div>
              </div>
              <!-- 3rd Place -->
              <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 6px; border-radius: 6px; width: 30%;">
                <div style="font-size: 14px;">🥉</div>
                <div style="font-size: 10px; font-weight: bold; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${third.name}</div>
                <div style="font-size: 11px; font-weight: bold; color: #4ade80;">${third.score}p</div>
              </div>
            </div>

            <button onclick="toggleCardView('${room.roomId}')" style="width: 100%; padding: 5px; font-size: 11px; background: #475569; color: white; border-radius: 4px; border: none; cursor: pointer; font-weight: bold;">Close Podium & View Card</button>
          </div>
        `;
      } else if (isEnded && !podiumViewToggles[room.roomId]) {
        // 📋 STANDARD CARD VIEW (WHEN PODIUM IS CLOSED)
        const winner = topLeaderboard[0];
        leaderboardHtml = `
          <div style="background: #fff; padding: 8px; border: 1px solid #eee; border-radius: 4px; margin-bottom: 5px; text-align: center;">
            <div style="font-size: 12px; font-weight: bold; color: #d97706;">Winner: ${winner ? winner.name : 'N/A'} (${winner ? winner.score : 0} pts)</div>
          </div>
          <button onclick="toggleCardView('${room.roomId}')" style="width: 100%; padding: 5px; font-size: 11px; background: #9333ea; color: white; border-radius: 4px; border: none; cursor: pointer; font-weight: bold;">🏆 View Podium</button>
        `;
      } else {
        // 📊 STANDARD LIVE PREVIEW FORMAT DURING THE QUIZ
        leaderboardHtml = topLeaderboard.slice(0, 3).map((p, idx) => `
          <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 6px; background: rgba(255,255,255,0.03); border-radius: 4px; margin-bottom: 2px;">
            <span>#${idx+1} ${p.name}</span>
            <strong style="color: #4ade80;">${p.score} pts</strong>
          </div>
        `).join('');
      }

      return `
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 6px; background: #fafafa;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 8px;">
            <span>Teacher: ${room.teacherName}</span>
            <span style="color: ${isEnded ? '#dc3545' : '#28a745'};">${room.status.toUpperCase()}</span>
          </div>
          <div style="font-size: 13px; color: #555; margin-bottom: 10px;">
            <div>Topic: <strong>${room.category}</strong></div>
            <div>Mode: <strong>${room.mode}</strong> (${room.studentCount} students)</div>
          </div>
          <div style="margin-bottom: 10px;">
            ${leaderboardHtml}
          </div>
          <div style="display: flex; gap: 5px;">
            <button onclick="inspectRoom('${room.roomId}')" style="padding: 6px 10px; font-size: 12px; flex: 1;">Inspect</button>
            ${!isEnded ? `<button onclick="adminEndRoom('${room.roomId}')" style="padding: 6px 10px; font-size: 12px; background: #ffc107; color: #000;">End</button>` : ''}
            <button onclick="adminRemoveRoom('${room.roomId}')" style="padding: 6px 10px; font-size: 12px; background: #dc3545;">Clear</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 🔄 Toggle between inline card podium and standard card view
  window.toggleCardView = function(roomId) {
    podiumViewToggles[roomId] = !podiumViewToggles[roomId];
    renderAdminRooms(activeRoomsCache);
  };

  window.inspectRoom = function(roomId) {
    const room = activeRoomsCache.find(r => r.roomId === roomId);
    if (!room) return;

    document.getElementById('modal-room-subtitle').textContent = `Teacher: ${room.teacherName} | Room ID: ${room.roomId} (${room.category} - ${room.mode})`;
    const tbody = document.getElementById('modal-leaderboard-body');
    
    tbody.innerHTML = (room.leaderboard || []).length === 0 
      ? `<tr><td colspan="4" style="text-align: center; color: #666;">No participants scored yet.</td></tr>`
      : room.leaderboard.map((p, idx) => `
          <tr>
            <td>#${idx + 1}</td>
            <td>${p.name}</td>
            <td>${p.score} pts</td>
            <td>${p.totalTime || 0}s</td>
          </tr>
        `).join('');

    document.getElementById('adminLeaderboardModal').style.display = 'flex';
  };

  window.closeAdminLeaderboardModal = function() {
    document.getElementById('adminLeaderboardModal').style.display = 'none';
  };

  window.adminEndRoom = function(roomId) {
    if (confirm(`Force-end room ${roomId}?`)) {
      socket.emit('admin_end_room', { roomId });
    }
  };

  window.adminRemoveRoom = function(roomId) {
    if (confirm(`Remove room ${roomId} from server?`)) {
      socket.emit('admin_remove_room', { roomId });
    }
  };

  // Fetch and render users for Admin
  window.loadAdminUsers = async function() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        const tbody = document.getElementById('userTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        data.users.forEach(user => {
          const topicsStr = Array.isArray(user.assignedTopics) ? user.assignedTopics.join(', ') : (user.assignedQuiz || 'default');
          tbody.innerHTML += `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td class="px-4 py-3 text-xs text-slate-200">${user.username}</td>
              <td class="px-4 py-3 text-xs text-slate-300 capitalize">${user.role}</td>
              <td class="px-4 py-3 text-xs text-purple-300">${topicsStr}</td>
              <td class="px-4 py-3 text-xs text-right space-x-2">
                <button onclick='openEditModal("${user._id}", ${JSON.stringify(user.username)}, "${user.role}", ${JSON.stringify(user.assignedTopics || [])})' class="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all">Edit</button>
                <button onclick="deleteUser('${user._id}')" class="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all">Delete</button>
              </td>
            </tr>
          `;
        });
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  // Create New User Handler
  const createUserForm = document.getElementById('createUserForm');
  if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('new-username').value.trim();
      const password = document.getElementById('new-password').value.trim();
      const role = document.getElementById('new-role').value;
      
      const checkedBoxes = document.querySelectorAll('input[name="selectedTopics"]:checked');
      const assignedTopics = Array.from(checkedBoxes).map(cb => cb.value);

      if (assignedTopics.length === 0) {
        alert('Please select at least one topic for the user.');
        return;
      }

      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role, assignedTopics })
        });
        const data = await res.json();
        if (data.success) {
          alert('User created successfully!');
          createUserForm.reset();
          document.querySelectorAll('input[name="selectedTopics"]').forEach(cb => cb.checked = false);
          loadAdminUsers();
        } else {
          alert(data.message);
        }
      } catch (err) {
        alert('Error creating user.');
      }
    });
  }

  // Delete User Handler
  window.deleteUser = async function(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadAdminUsers();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error deleting user.');
    }
  };

  // Edit Modal Controllers
  window.openEditModal = function(id, username, role, assignedTopics) {
    document.getElementById('edit-user-id').value = id;
    document.getElementById('edit-username').value = username;
    document.getElementById('edit-password').value = '';
    document.getElementById('edit-role').value = role;

    const editCheckboxes = document.querySelectorAll('input[name="editSelectedTopics"]');
    editCheckboxes.forEach(cb => {
      cb.checked = Array.isArray(assignedTopics) && assignedTopics.includes(cb.value);
    });

    document.getElementById('editModal').classList.remove('hidden');
  };

  window.closeEditModal = function() {
    document.getElementById('editModal').classList.add('hidden');
  };

  // Edit User Form Submission Handler
  const editUserForm = document.getElementById('editUserForm');
  if (editUserForm) {
    editUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-user-id').value;
      const username = document.getElementById('edit-username').value.trim();
      const password = document.getElementById('edit-password').value.trim();
      const role = document.getElementById('edit-role').value;

      const checkedBoxes = document.querySelectorAll('input[name="editSelectedTopics"]:checked');
      const assignedTopics = Array.from(checkedBoxes).map(cb => cb.value);

      if (assignedTopics.length === 0) {
        alert('Please select at least one topic for the user.');
        return;
      }

      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role, assignedTopics })
        });
        const data = await res.json();
        if (data.success) {
          alert('User updated successfully!');
          closeEditModal();
          loadAdminUsers();
        } else {
          alert(data.message);
        }
      } catch (err) {
        alert('Error updating user.');
      }
    });
  }
});
