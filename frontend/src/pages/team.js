import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';

// Import the layout component dynamically to avoid hydration issues
const DashboardLayout = dynamic(() => import('../components/layouts/DashboardLayout'), {
  ssr: false
});
import {
  getUsers,
  inviteUser,
  updateUserRole,
  deleteUser,
} from '../features/users/userSlice';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  CircularProgress,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

const roleColors = {
  admin: 'error',
  project_manager: 'warning',
  team_member: 'primary',
};

export default function TeamMembers() {
  const dispatch = useDispatch();
  const { users, isLoading, error } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'team_member',
  });
  const [editForm, setEditForm] = useState({
    role: '',
  });
  
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);
  
  const handleOpenInviteDialog = () => {
    setOpenInviteDialog(true);
  };
  
  const handleCloseInviteDialog = () => {
    setOpenInviteDialog(false);
  };
  
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
    });
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
  };
  
  const handleInviteFormChange = (e) => {
    setInviteForm({
      ...inviteForm,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleEditFormChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleInviteSubmit = (e) => {
    e.preventDefault();
    dispatch(inviteUser(inviteForm));
    handleCloseInviteDialog();
    setInviteForm({ email: '', role: 'team_member' });
  };
  
  const handleEditSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserRole({ userId: selectedUser._id, role: editForm.role }));
    handleCloseEditDialog();
  };
  
  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      dispatch(deleteUser(userId));
    }
  };
  
  const getNameInitials = (name) => {
    if (!name) return 'U'; // Return 'U' for undefined or empty names
    
    try {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    } catch (error) {
      return 'U'; // Fallback to 'U' in case of error
    }
  };
  
  const getRandomColor = (userId) => {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
      '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
    ];
    
    if (!userId) {
      // Return a random color if userId is not available
      return colors[Math.floor(Math.random() * colors.length)];
    }
    
    try {
      const hash = userId.toString().split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      return colors[hash % colors.length];
    } catch (error) {
      // Fallback to a random color in case of error
      return colors[Math.floor(Math.random() * colors.length)];
    }
  };
  
  const isCurrentUser = (userId) => {
    return currentUser?._id === userId;
  };
  
  const isAdmin = currentUser?.role === 'admin';
  
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Team Members</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenInviteDialog}
          >
            Invite User
          </Button>
        )}
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No team members found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: getRandomColor(user._id),
                            mr: 2,
                          }}
                        >
                          {getNameInitials(user.name)}
                        </Avatar>
                        <Typography>
                          {user.name}
                          {isCurrentUser(user._id) && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              (you)
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        color={roleColors[user.role]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status || 'Active'}
                        color={user.status === 'Invited' ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        {!isCurrentUser(user._id) && (
                          <>
                            <Tooltip title="Edit Role">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(user)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove User">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Invite User Dialog */}
      <Dialog open={openInviteDialog} onClose={handleCloseInviteDialog} fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={inviteForm.email}
            onChange={handleInviteFormChange}
            required
            autoFocus
          />
          <TextField
            margin="dense"
            name="role"
            label="Role"
            fullWidth
            variant="outlined"
            value={inviteForm.role}
            onChange={handleInviteFormChange}
            select
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="project_manager">Project Manager</MenuItem>
            <MenuItem value="team_member">Team Member</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteDialog}>Cancel</Button>
          <Button
            onClick={handleInviteSubmit}
            variant="contained"
            startIcon={<EmailIcon />}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} fullWidth>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              {selectedUser?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedUser?.email}
            </Typography>
          </Box>
          <TextField
            margin="dense"
            name="role"
            label="Role"
            fullWidth
            variant="outlined"
            value={editForm.role}
            onChange={handleEditFormChange}
            select
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="project_manager">Project Manager</MenuItem>
            <MenuItem value="team_member">Team Member</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
