const auth = firebase.auth();
const db = firebase.firestore();
let isAdmin = false;

// Verificar autenticação e status de admin
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Verificar se é admin
    const userDoc = await db.collection('users').doc(user.uid).get();
    isAdmin = userDoc.data()?.isAdmin || false;

    // Mostrar/esconder elementos de admin
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.display = isAdmin ? 'block' : 'none';
    });

    // Carregar registros
    carregarRegistros();
});

// Elementos do DOM
const form = document.getElementById('bulkingForm');
const tabela = document.getElementById('registrosBody');
const btnLogout = document.getElementById('btnLogout');
const usersList = document.getElementById('usersList');

// Função para formatar a data
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// Função para formatar número com uma casa decimal
function formatarNumero(numero) {
    return Number(numero).toFixed(1);
}

// Função para adicionar novo registro
async function adicionarRegistro(e) {
    e.preventDefault();

    const novoRegistro = {
        userId: auth.currentUser.uid,
        data: document.getElementById('data').value,
        peso: parseFloat(document.getElementById('peso').value),
        peito: parseFloat(document.getElementById('peito').value),
        cintura: parseFloat(document.getElementById('cintura').value),
        ombro_esquerdo: parseFloat(document.getElementById('ombro_esquerdo').value),
        ombro_direito: parseFloat(document.getElementById('ombro_direito').value),
        largura_ombros: parseFloat(document.getElementById('largura_ombros').value),
        braco_direito: parseFloat(document.getElementById('braco_direito').value),
        braco_esquerdo: parseFloat(document.getElementById('braco_esquerdo').value),
        antebraco_direito: parseFloat(document.getElementById('antebraco_direito').value),
        antebraco_esquerdo: parseFloat(document.getElementById('antebraco_esquerdo').value),
        perna_direita: parseFloat(document.getElementById('perna_direita').value),
        perna_esquerda: parseFloat(document.getElementById('perna_esquerda').value),
        panturrilha_direita: parseFloat(document.getElementById('panturrilha_direita').value),
        panturrilha_esquerda: parseFloat(document.getElementById('panturrilha_esquerda').value),
        timestamp: new Date()
    };

    try {
        await db.collection("registros").add(novoRegistro);
        form.reset();
        carregarRegistros();
    } catch (error) {
        console.error("Erro ao adicionar registro:", error);
        alert("Erro ao salvar registro");
    }
}

// Função para carregar registros
async function carregarRegistros() {
    if (!auth.currentUser) return;

    tabela.innerHTML = '';
    
    try {
        let query = db.collection("registros");
        
        // Se não for admin, mostrar apenas registros do usuário
        if (!isAdmin) {
            query = query.where("userId", "==", auth.currentUser.uid);
        }
        
        const snapshot = await query.get();
        const registros = [];
        
        snapshot.forEach((doc) => {
            registros.push({ id: doc.id, ...doc.data() });
        });

        registros.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

        for (const registro of registros) {
            const tr = document.createElement('tr');
            
            // Se for admin, buscar informações do usuário
            let userEmail = '';
            if (isAdmin && registro.userId) {
                const userDoc = await db.collection('users').doc(registro.userId).get();
                userEmail = userDoc.data()?.email || 'Usuário não encontrado';
            }

            tr.innerHTML = `
                ${isAdmin ? `<td>${userEmail}</td>` : ''}
                <td>${formatarData(registro.data)}</td>
                <td>${formatarNumero(registro.peso)}</td>
                <td>${formatarNumero(registro.peito)}</td>
                <td>${formatarNumero(registro.cintura)}</td>
                <td>${formatarNumero(registro.ombro_esquerdo)}</td>
                <td>${formatarNumero(registro.ombro_direito)}</td>
                <td>${formatarNumero(registro.largura_ombros)}</td>
                <td>${formatarNumero(registro.braco_direito)}</td>
                <td>${formatarNumero(registro.braco_esquerdo)}</td>
                <td>${formatarNumero(registro.antebraco_direito)}</td>
                <td>${formatarNumero(registro.antebraco_esquerdo)}</td>
                <td>${formatarNumero(registro.perna_direita)}</td>
                <td>${formatarNumero(registro.perna_esquerda)}</td>
                <td>${formatarNumero(registro.panturrilha_direita)}</td>
                <td>${formatarNumero(registro.panturrilha_esquerda)}</td>
                <td>
                    ${isAdmin || registro.userId === auth.currentUser.uid ? `
                        <button class="btn-delete" onclick="removerRegistro('${registro.id}')">
                            Excluir
                        </button>
                    ` : ''}
                </td>
            `;
            tabela.appendChild(tr);
        }

        // Se for admin, carregar lista de usuários
        if (isAdmin && usersList) {
            carregarUsuarios();
        }
    } catch (error) {
        console.error("Erro ao carregar registros:", error);
        alert("Erro ao carregar registros");
    }
}

// Função para carregar usuários (apenas para admin)
async function carregarUsuarios() {
    if (!isAdmin || !usersList) return;

    try {
        const snapshot = await db.collection('users').get();
        usersList.innerHTML = '';

        snapshot.forEach(doc => {
            const user = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${user.email}</span>
                <button onclick="toggleAdmin('${doc.id}', ${!user.isAdmin})">
                    ${user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                </button>
                ${user.isAdmin ? '' : `
                    <button onclick="deleteUser('${doc.id}')" class="btn-delete">
                        Excluir Usuário
                    </button>
                `}
            `;
            usersList.appendChild(li);
        });
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        alert("Erro ao carregar lista de usuários");
    }
}

// Função para alternar status de admin de um usuário
async function toggleAdmin(userId, newStatus) {
    if (!isAdmin) return;

    try {
        await db.collection('users').doc(userId).update({
            isAdmin: newStatus
        });
        carregarUsuarios();
    } catch (error) {
        console.error("Erro ao atualizar status de admin:", error);
        alert("Erro ao atualizar usuário");
    }
}

// Função para deletar um usuário
async function deleteUser(userId) {
    if (!isAdmin) return;
    if (!confirm('Tem certeza que deseja excluir este usuário e todos os seus registros?')) return;

    try {
        // Deletar todos os registros do usuário
        const registrosSnapshot = await db.collection('registros')
            .where('userId', '==', userId)
            .get();
        
        const batch = db.batch();
        registrosSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Deletar o usuário
        batch.delete(db.collection('users').doc(userId));
        await batch.commit();

        carregarUsuarios();
        carregarRegistros();
    } catch (error) {
        console.error("Erro ao deletar usuário:", error);
        alert("Erro ao deletar usuário");
    }
}

// Função para remover registro
async function removerRegistro(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
        await db.collection("registros").doc(id).delete();
        carregarRegistros();
    } catch (error) {
        console.error("Erro ao remover registro:", error);
        alert("Erro ao excluir registro");
    }
}

// Função para fazer logout
async function fazerLogout() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao fazer logout");
    }
}

// Event Listeners
form.addEventListener('submit', adicionarRegistro);
btnLogout.addEventListener('click', fazerLogout);

// Tornar funções globais
window.removerRegistro = removerRegistro;
window.toggleAdmin = toggleAdmin;
window.deleteUser = deleteUser;

// Preencher data atual no campo de data
document.getElementById('data').valueAsDate = new Date(); 