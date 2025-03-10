const auth = firebase.auth();
const db = firebase.firestore();
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const btnRegister = document.getElementById('btnRegister');
const errorMessage = document.getElementById('errorMessage');

// Verificar se já está logado
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Verificar se é o primeiro usuário (será definido como admin)
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();
        
        // Se não existir documento do usuário, criar um
        const userDoc = await usersRef.doc(user.uid).get();
        if (!userDoc.exists) {
            // Se for o primeiro usuário, será admin
            const isFirstUser = snapshot.size === 0;
            await usersRef.doc(user.uid).set({
                email: user.email,
                isAdmin: isFirstUser,
                createdAt: new Date()
            });
        }
        
        window.location.href = 'index.html';
    }
});

// Função para mostrar erro
function mostrarErro(mensagem) {
    errorMessage.textContent = mensagem;
    errorMessage.style.display = 'block';
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value;
    const senha = senhaInput.value;

    try {
        await auth.signInWithEmailAndPassword(email, senha);
        // O redirecionamento será feito pelo onAuthStateChanged
    } catch (error) {
        console.error("Erro no login:", error);
        switch (error.code) {
            case 'auth/invalid-email':
                mostrarErro('E-mail inválido');
                break;
            case 'auth/user-not-found':
                mostrarErro('Usuário não encontrado');
                break;
            case 'auth/wrong-password':
                mostrarErro('Senha incorreta');
                break;
            default:
                mostrarErro('Erro ao fazer login');
        }
    }
});

// Cadastro
btnRegister.addEventListener('click', async () => {
    const email = emailInput.value;
    const senha = senhaInput.value;

    if (!email || !senha) {
        mostrarErro('Preencha todos os campos');
        return;
    }

    if (senha.length < 6) {
        mostrarErro('A senha deve ter pelo menos 6 caracteres');
        return;
    }

    try {
        // Desabilitar o botão durante o cadastro
        btnRegister.disabled = true;
        btnRegister.textContent = 'Cadastrando...';

        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        const user = userCredential.user;

        // Verificar se é o primeiro usuário (será definido como admin)
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();
        
        // Criar documento do usuário
        await usersRef.doc(user.uid).set({
            email: email,
            isAdmin: snapshot.size === 0, // Primeiro usuário será admin
            createdAt: new Date()
        });

        // O redirecionamento será feito pelo onAuthStateChanged
    } catch (error) {
        console.error("Erro no cadastro:", error);
        switch (error.code) {
            case 'auth/email-already-in-use':
                mostrarErro('Este e-mail já está em uso');
                break;
            case 'auth/invalid-email':
                mostrarErro('E-mail inválido');
                break;
            default:
                mostrarErro('Erro ao criar conta');
        }
    } finally {
        // Reabilitar o botão
        btnRegister.disabled = false;
        btnRegister.textContent = 'Cadastrar';
    }
}); 