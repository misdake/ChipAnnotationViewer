A die shot & annotation viewer. Webpage: <https://misdake.github.io/ChipAnnotationViewer/>

This project is WIP, with minimal UI.

Features:
1. view die shot like a tiled-map
2. view posted annotations stored in Github issues ([example viewer link](https://misdake.github.io/ChipAnnotationViewer/?chip=Fiji&commentId=453739448), corresponding [issue comment](https://github.com/misdake/ChipAnnotationData/issues/1#issuecomment-453739448))
3. place polygons, polylines, labels
4. calculate polygon area and polyline length
5. export current annotations as json and share it by posting it as an issue comment (then select it in 2.)

Current die shots:

- ATI/AMD GPU:
    - (Pre-DX10) [R420](https://misdake.github.io/ChipAnnotationViewer/?chip=R420), [R430](https://misdake.github.io/ChipAnnotationViewer/?chip=R430), [R520](https://misdake.github.io/ChipAnnotationViewer/?chip=R520), [R580](https://misdake.github.io/ChipAnnotationViewer/?chip=R580), [RV350](https://misdake.github.io/ChipAnnotationViewer/?chip=RV350), [RV570](https://misdake.github.io/ChipAnnotationViewer/?chip=RV570)
    - (TeraScale123) [R600](https://misdake.github.io/ChipAnnotationViewer/?chip=R600), [RV670](https://misdake.github.io/ChipAnnotationViewer/?chip=RV670), [RV770](https://misdake.github.io/ChipAnnotationViewer/?chip=RV770), [Barts](https://misdake.github.io/ChipAnnotationViewer/?chip=Barts), [Cayman](https://misdake.github.io/ChipAnnotationViewer/?chip=Cayman)
    - (GCN12345) [Pitcairn](https://misdake.github.io/ChipAnnotationViewer/?chip=Pitcairn), [Tahiti](https://misdake.github.io/ChipAnnotationViewer/?chip=Tahiti), [Hawaii](https://misdake.github.io/ChipAnnotationViewer/?chip=Hawaii), [Fiji](https://misdake.github.io/ChipAnnotationViewer/?chip=Fiji), [Polaris10](https://misdake.github.io/ChipAnnotationViewer/?chip=Polaris10), [Polaris11](https://misdake.github.io/ChipAnnotationViewer/?chip=Polaris11), [Polaris22](https://misdake.github.io/ChipAnnotationViewer/?chip=Polaris22), [Vega10](https://misdake.github.io/ChipAnnotationViewer/?chip=Vega10), [Vega20](https://misdake.github.io/ChipAnnotationViewer/?chip=Vega20)
    - (RDNA1) [Navi10](https://misdake.github.io/ChipAnnotationViewer/?chip=Navi10), [Navi14](https://misdake.github.io/ChipAnnotationViewer/?chip=Navi14)

- AMD CPU/APU:
    - (Pre-Zen) [K6](https://misdake.github.io/ChipAnnotationViewer/?chip=K6), [Zacate](https://misdake.github.io/ChipAnnotationViewer/?chip=Zacate), [Llano](https://misdake.github.io/ChipAnnotationViewer/?chip=Llano), [Kaveri](https://misdake.github.io/ChipAnnotationViewer/?chip=Kaveri)
    - (Zen - Zen2) [Zeppelin](https://misdake.github.io/ChipAnnotationViewer/?chip=Zeppelin), [Raven_Ridge](https://misdake.github.io/ChipAnnotationViewer/?chip=Raven_Ridge), [Matisse_IOD](https://misdake.github.io/ChipAnnotationViewer/?chip=Matisse_IOD), [Rome_IOD](https://misdake.github.io/ChipAnnotationViewer/?chip=Rome_IOD), [Zen2_CCD](https://misdake.github.io/ChipAnnotationViewer/?chip=Zen2_CCD), [Zen2_Core](https://misdake.github.io/ChipAnnotationViewer/?chip=Zen2_Core), [Renoir](https://misdake.github.io/ChipAnnotationViewer/?chip=Renoir)
- Intel CPU:
    - [P54C](https://misdake.github.io/ChipAnnotationViewer/?chip=P54C), [Coppermine](https://misdake.github.io/ChipAnnotationViewer/?chip=Coppermine), [Conroe](https://misdake.github.io/ChipAnnotationViewer/?chip=Conroe), [SandyBridge_4+2](https://misdake.github.io/ChipAnnotationViewer/?chip=SandyBridge_4+2), [SandyBridge_Core](https://misdake.github.io/ChipAnnotationViewer/?chip=SandyBridge_Core), [SandyBridge_IGP](https://misdake.github.io/ChipAnnotationViewer/?chip=SandyBridge_IGP), [IvyBridge_2+2](https://misdake.github.io/ChipAnnotationViewer/?chip=IvyBridge_2+2), [Skylake_Core](https://misdake.github.io/ChipAnnotationViewer/?chip=Skylake_Core), [Skylake_LCC](https://misdake.github.io/ChipAnnotationViewer/?chip=Skylake_LCC), [Kabylake_2+2](https://misdake.github.io/ChipAnnotationViewer/?chip=Kabylake_2+2)
- nVIDIA GPU:
    - (Pre-DX10) [NV40](https://misdake.github.io/ChipAnnotationViewer/?chip=NV40), [NV42](https://misdake.github.io/ChipAnnotationViewer/?chip=NV42), [NV43](https://misdake.github.io/ChipAnnotationViewer/?chip=NV43), [G70](https://misdake.github.io/ChipAnnotationViewer/?chip=G70), [G71](https://misdake.github.io/ChipAnnotationViewer/?chip=G71), [G72](https://misdake.github.io/ChipAnnotationViewer/?chip=G72), [G73](https://misdake.github.io/ChipAnnotationViewer/?chip=G73)
    - (Tesla) [G80](https://misdake.github.io/ChipAnnotationViewer/?chip=G80), [G84](https://misdake.github.io/ChipAnnotationViewer/?chip=G84), [G86](https://misdake.github.io/ChipAnnotationViewer/?chip=G86), [G92](https://misdake.github.io/ChipAnnotationViewer/?chip=G92), [G94](https://misdake.github.io/ChipAnnotationViewer/?chip=G94), [GT200](https://misdake.github.io/ChipAnnotationViewer/?chip=GT200), [GT218](https://misdake.github.io/ChipAnnotationViewer/?chip=GT218)
    - (Fermi) [GF100](https://misdake.github.io/ChipAnnotationViewer/?chip=GF100), [GF106](https://misdake.github.io/ChipAnnotationViewer/?chip=GF106), [GF108](https://misdake.github.io/ChipAnnotationViewer/?chip=GF108), [GF114](https://misdake.github.io/ChipAnnotationViewer/?chip=GF114)
    - (Kepler) [GK104](https://misdake.github.io/ChipAnnotationViewer/?chip=GK104), [GK106](https://misdake.github.io/ChipAnnotationViewer/?chip=GK106), [GK110](https://misdake.github.io/ChipAnnotationViewer/?chip=GK110)
    - (Maxwell) [GM107](https://misdake.github.io/ChipAnnotationViewer/?chip=GM107), [GM200](https://misdake.github.io/ChipAnnotationViewer/?chip=GM200), [GM204](https://misdake.github.io/ChipAnnotationViewer/?chip=GM204)
    - (Pascal) [GP102](https://misdake.github.io/ChipAnnotationViewer/?chip=GP102), [GP104](https://misdake.github.io/ChipAnnotationViewer/?chip=GP104), [GP106](https://misdake.github.io/ChipAnnotationViewer/?chip=GP106)
    - (Turing) [TU102](https://misdake.github.io/ChipAnnotationViewer/?chip=TU102), [TU104](https://misdake.github.io/ChipAnnotationViewer/?chip=TU104), [TU106](https://misdake.github.io/ChipAnnotationViewer/?chip=TU106), [TU116](https://misdake.github.io/ChipAnnotationViewer/?chip=TU116)
- Console:
    - (Microsoft) [Xbox_One](https://misdake.github.io/ChipAnnotationViewer/?chip=Xbox_One), [Xbox_Series_X](https://misdake.github.io/ChipAnnotationViewer/?chip=Xbox_Series_X)
    - (Sony) [RSX(PS3)](https://misdake.github.io/ChipAnnotationViewer/?chip=RSX), [PS4](https://misdake.github.io/ChipAnnotationViewer/?chip=PS4), [PS4Pro](https://misdake.github.io/ChipAnnotationViewer/?chip=PS4Pro)

Extra links:
- Image storage: <https://github.com/misdake/ChipAnnotationData>, [Data2](https://github.com/misdake/ChipAnnotationData2), [Data3](https://github.com/misdake/ChipAnnotationData3)
- Image processor: <https://github.com/misdake/ChipAnnotationTool>
