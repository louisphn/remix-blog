import { db } from './db.server';
import bcrypt from 'bcrypt';
import { createCookieSessionStorage, redirect } from 'remix'

// login user
export async function login({username, password}) {
	const user = await db.user.findUnique({
		where: {
			username
		}
	})
	if (!user) return null;

	// Check password
	const isCorrectPassword = await bcrypt.compare(password, user.passwordHash)
	
	if (!isCorrectPassword) return null;

	console.log(user)
	return user;
}

// register new user
export async function register ({username, password}) {
	const passwordHash = await bcrypt.hash(password, 10)
	return db.user.create({
		data: {
			username,
			passwordHash
		}
	})
}
// get session secret
const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
	throw new Error('No session secret')
}

// create session storage
const storage = createCookieSessionStorage({
	cookie: {
		name: 'remixblog_session',
		secure: process.env.NODE_ENV === 'production' ? true : false,
		secrets: [sessionSecret],
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 60 * 24,
		httpOnly: true,
	}
})

// create session
export async function createUserSession (userId: string, redirectTo: string) {
	const session = await storage.getSession()
	session.set('userId', userId)
	return redirect(redirectTo, {
		headers: {
			'Set-Cookie': await storage.commitSession(session)
		}
	})
}

// get user session
export function getUserSession (request: Request) {
	return storage.getSession(request.headers.get('Cookie'))
}
// get logged in user
export async function getUser (request: Request) {
	const session = await getUserSession(request)
	const userId = session.get('userId')
	if (!userId || typeof userId !== 'string') {
		return null;
	} 
	try {
	  const user = await db.user.findUnique({
		  where: {
			  id: userId
		  }
	  })

	  return user;
	} catch (err) {
		return null;
	}
}

// logout and destroy session
export async function logout (request: Request) {
	const session = await storage.getSession(request.headers.get('Cookie'));

	return redirect('/auth/logout', {
		headers: {
			'Set-Cookie': await storage.destroySession(session)
		}
	})
}