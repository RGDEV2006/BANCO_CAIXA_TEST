const SUPABASE_URL = "https://pwreldwwyrlihlznczng.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "Ssb_secret_qfpu9T9m5nNRefktoi0igg_7sQUE0fQ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase conectado!");
async function carregarBoloes() {
    const { data, error } = await supabase
        .from('boloes')
        .select('*');

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log(data);
}

carregarBoloes();
async function criarBolao() {
    const { data, error } = await supabase
        .from('boloes')
        .insert({
            modalidade: 'Mega-Sena',
            concurso: '3000',
            premio_estimado: 100000000,
            total_cotas: 100,
            custo_cota: 10,
            venda_cota: 12,
            status: 'aberto'
        })
        .select();

    if (error) {
        console.error(error);
        return;
    }

    console.log('Bolão criado:', data);
}