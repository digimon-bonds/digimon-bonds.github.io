# BONDS OS v10 beta3 — acabamento de UX

Versão: 20261013-10-beta3.

- Ponto final na frase da abertura.
- Agumonhakase em Sistemas e Terriermon Assistant em Arquivos, usando os recortes existentes do Digibank.
- Ilustração do laço substitui a pop-art; composição com luz, dessaturação leve e bordas dissolvidas em CSS.
- Imagens fornecidas de cidade humana e digital entram como faixas panorâmicas nos cards, com transição para a superfície escura e espaço de leitura preservado.
- Rolagens automáticas mostram o solicitante extraído do preâmbulo do Forumeiros, tanto na identidade visual quanto no feed. Quando há perfil anterior correspondente na mesma página, reaproveita seu avatar; caso contrário, mostra a inicial, sem atribuir foto do narrador.

## Contratos preservados

Resultados, imagens de dados, texto da rolagem, autor técnico nativo, permissões e handlers ficam intactos. O perfil nativo do publicador automático continua no DOM, oculto apenas visualmente, enquanto a skin apresenta a pessoa que rolou. Nenhum post ou grupo foi alterado. Templates dos jogadores continuam fora do tratamento de Sistemas.

## Assets

Cinco novos WebP lossless; comparação RGBA exata com os originais. Imagens anteriores mantidas para compatibilidade com caches do beta2, não utilizadas na composição atual.

## Instalação

Atualizar o loader instalado para esta versão. CSS escopado e rollback mantidos; política atual no README.md. A ativação padrão 2.0 foi autorizada depois destes refinamentos; consultar README.md e INSTALL-FORUMEIROS.md. Envio de dados e controles autenticados ainda dependem do checklist real.
