const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { create } = require('../models/User')
const { connections } = require('mongoose')
const dotenv = require('dotenv')
const bcrypt = require('bcrypt')

dotenv.config()
// handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code)

  let errors = {
    email: '',
    password: '',
    lastName: '',
    firstName: '',
    contactNo: '',
    address: '',
    gender: '',
  }

  // incorrect email
  if (err.message === 'Incorrect Email') {
    errors.email = 'Email is not registered'
  }
  // incorrect password
  if (err.message === 'Incorrect Password') {
    errors.password = 'Incorrect Password'
  }

  // duplicate error code

  if (err.code === 11000) {
    errors.email = 'That email is already registered.'

    return errors
  }

  if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message
    })
    console.log(errors)
  }

  return errors
}

// 3 Days in Seconds
const MAX_AGE = 3 * 24 * 60 * 60

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: MAX_AGE })
}

module.exports.signup_get = (req, res) => {
  res.render('pages/signup', { rmWhitespace: true })
}
module.exports.login_get = (req, res) => {
  res.render('pages/login', { rmWhitespace: true })
}
module.exports.signup_post = async (req, res) => {
  let {
    email,
    password,
    lastName,
    firstName,
    contactNo,
    address,
    gender,
    isAdmin,
  } = req.body

  try {
    const salt = await bcrypt.genSalt()
    password = await bcrypt.hash(password, salt)

    const user = await User.create({
      email,
      password,
      lastName,
      firstName,
      contactNo,
      address,
      gender,
      isAdmin: false,
    })

    const token = createToken(user._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: MAX_AGE * 1000 })
    res.status(201).json({ user: user._id })
  } catch (err) {
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}
module.exports.login_post = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.login(email, password)
    const token = createToken(user._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: MAX_AGE * 1000 })
    res.status(200).json({ user: user._id })
  } catch (err) {
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 })

  res.redirect('/')
}
