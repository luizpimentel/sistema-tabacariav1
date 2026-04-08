import React from 'react';

const Comprovante = React.forwardRef(({ dados }, ref) => {
    if (!dados) return null;

    const { vendedor, itens, pagamentos, total, desconto, data, codigo, troco } = dados;

    return (
        <div className="area-impressao-oculta">
            <div ref={ref} className="conteudo-cupom" style={{
                width: '80mm',
                padding: '10px',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '12px',
                color: '#000',
                backgroundColor: '#fff'
            }}>

                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0' }}>DABOA TABACARIA</h2>
                    <p style={{ margin: 0 }}>Rua Exemplo, 123 - Centro</p>
                    <p style={{ margin: 0 }}>CNPJ: 00.000.000/0001-00</p>
                    <p style={{ margin: '5px 0' }}>--------------------------------</p>
                    <p style={{ margin: 0 }}><strong>RECIBO NÃO FISCAL</strong></p>
                    <p style={{ margin: 0 }}>Venda #{codigo ? codigo.toString().slice(-6) : '---'}</p>
                    <p style={{ margin: 0 }}>{new Date(data).toLocaleString()}</p>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #000', paddingBottom: '2px', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>ITEM</span>
                        <span style={{ fontWeight: 'bold' }}>TOTAL</span>
                    </div>
                    {itens.map((item, index) => (
                        <div key={index} style={{ marginBottom: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{item.produtoNome}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{item.quantidade}x R$ {item.precoUnitario ? item.precoUnitario.toFixed(2) : '0.00'}</span>
                                <span>R$ {(item.quantidade * (item.precoUnitario || 0)).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', marginBottom: '10px' }}>
                    {desconto > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Desconto:</span>
                            <span>- R$ {desconto.toFixed(2)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginTop: '5px' }}>
                        <span>TOTAL:</span>
                        <span>R$ {total.toFixed(2)}</span>
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    {pagamentos.map((pg, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ textTransform: 'uppercase' }}>{pg.metodo.replace('_', ' ')}</span>
                            <span>R$ {pg.valor.toFixed(2)}</span>
                        </div>
                    ))}
                    {troco > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>Troco</span>
                            <span>R$ {troco.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', borderTop: '1px solid #000', paddingTop: '10px' }}>
                    <p style={{ margin: 0 }}>Atendente: {vendedor?.nome || 'Balcão'}</p>
                    <p style={{ margin: '10px 0', fontWeight: 'bold' }}>OBRIGADO PELA PREFERÊNCIA!</p>
                    <p style={{ fontSize: '10px' }}>Sistema DaBoa v1.0</p>
                </div>

            </div>
        </div>
    );
});

export default Comprovante;