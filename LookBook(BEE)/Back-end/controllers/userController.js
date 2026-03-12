const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const filePath = path.join(__dirname, "../data/users.json");

function getUsers() {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let users = getUsers();
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email,
      password: hashedPassword
    };
    users.push(newUser);
    saveUsers(users);
    res.json({
      message: "Signup successful",
      user: { name, email }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Wrong password" });
    }
    res.json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUser = (req, res) => {
  try {
    const users = getUsers();
    const user = users.find(u => u.email === req.params.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};