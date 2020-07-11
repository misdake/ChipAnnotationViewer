A die shot & annotation viewer. Webpage: <https://misdake.github.io/ChipAnnotationViewer/>

This project is WIP, with minimal UI.

Features:
1. view die shot like a tiled-map
2. view posted annotations stored in Github issues ([example viewer link](https://misdake.github.io/ChipAnnotationViewer/?map=Fiji&commentId=453739448), corresponding [issue comment](https://github.com/misdake/ChipAnnotationData/issues/1#issuecomment-453739448))
3. place polygons, polylines, labels
4. calculate polygon area and polyline length
5. export current annotations as json and share it by posting it as an issue comment (then select it in 2.)

Current die shots:

- ATI/AMD GPU:
    - (Pre-DX10) [R420](https://misdake.github.io/ChipAnnotationViewer/?map=R420), [R430](https://misdake.github.io/ChipAnnotationViewer/?map=R430), [R520](https://misdake.github.io/ChipAnnotationViewer/?map=R520), [R580](https://misdake.github.io/ChipAnnotationViewer/?map=R580), [RV350](https://misdake.github.io/ChipAnnotationViewer/?map=RV350), [RV570](https://misdake.github.io/ChipAnnotationViewer/?map=RV570)
    - (TeraScale123) [R600](https://misdake.github.io/ChipAnnotationViewer/?map=R600), [RV670](https://misdake.github.io/ChipAnnotationViewer/?map=RV670), [RV770](https://misdake.github.io/ChipAnnotationViewer/?map=RV770), [Barts](https://misdake.github.io/ChipAnnotationViewer/?map=Barts), [Cayman](https://misdake.github.io/ChipAnnotationViewer/?map=Cayman)
    - (GCN12345) [Pitcairn](https://misdake.github.io/ChipAnnotationViewer/?map=Pitcairn), [Tahiti](https://misdake.github.io/ChipAnnotationViewer/?map=Tahiti), [Hawaii](https://misdake.github.io/ChipAnnotationViewer/?map=Hawaii), [Fiji](https://misdake.github.io/ChipAnnotationViewer/?map=Fiji), [Polaris10](https://misdake.github.io/ChipAnnotationViewer/?map=Polaris10), [Polaris11](https://misdake.github.io/ChipAnnotationViewer/?map=Polaris11), [Polaris22](https://misdake.github.io/ChipAnnotationViewer/?map=Polaris22), [Vega10](https://misdake.github.io/ChipAnnotationViewer/?map=Vega10), [Vega20](https://misdake.github.io/ChipAnnotationViewer/?map=Vega20)
    - (RDNA1) [Navi10](https://misdake.github.io/ChipAnnotationViewer/?map=Navi10), [Navi14](https://misdake.github.io/ChipAnnotationViewer/?map=Navi14)

- AMD CPU/APU:
    - (Pre-Zen) [K6](https://misdake.github.io/ChipAnnotationViewer/?map=K6), [Zacate](https://misdake.github.io/ChipAnnotationViewer/?map=Zacate), [Llano](https://misdake.github.io/ChipAnnotationViewer/?map=Llano), [Kaveri](https://misdake.github.io/ChipAnnotationViewer/?map=Kaveri)
    - (Zen - Zen2) [Zeppelin](https://misdake.github.io/ChipAnnotationViewer/?map=Zeppelin), [Raven_Ridge](https://misdake.github.io/ChipAnnotationViewer/?map=Raven_Ridge), [Matisse_IOD](https://misdake.github.io/ChipAnnotationViewer/?map=Matisse_IOD), [Rome_IOD](https://misdake.github.io/ChipAnnotationViewer/?map=Rome_IOD), [Zen2_CCD](https://misdake.github.io/ChipAnnotationViewer/?map=Zen2_CCD), [Zen2_Core](https://misdake.github.io/ChipAnnotationViewer/?map=Zen2_Core), [Renoir](https://misdake.github.io/ChipAnnotationViewer/?map=Renoir)
- Intel CPU:
    - [P54C](https://misdake.github.io/ChipAnnotationViewer/?map=P54C), [Coppermine](https://misdake.github.io/ChipAnnotationViewer/?map=Coppermine), [Conroe](https://misdake.github.io/ChipAnnotationViewer/?map=Conroe), [SandyBridge_4+2](https://misdake.github.io/ChipAnnotationViewer/?map=SandyBridge_4+2), [SandyBridge_Core](https://misdake.github.io/ChipAnnotationViewer/?map=SandyBridge_Core), [SandyBridge_IGP](https://misdake.github.io/ChipAnnotationViewer/?map=SandyBridge_IGP), [IvyBridge_2+2](https://misdake.github.io/ChipAnnotationViewer/?map=IvyBridge_2+2), [Skylake_Core](https://misdake.github.io/ChipAnnotationViewer/?map=Skylake_Core), [Skylake_LCC](https://misdake.github.io/ChipAnnotationViewer/?map=Skylake_LCC), [Kabylake_2+2](https://misdake.github.io/ChipAnnotationViewer/?map=Kabylake_2+2)
- nVIDIA GPU:
    - (Pre-DX10) [NV40](https://misdake.github.io/ChipAnnotationViewer/?map=NV40), [NV42](https://misdake.github.io/ChipAnnotationViewer/?map=NV42), [NV43](https://misdake.github.io/ChipAnnotationViewer/?map=NV43), [G70](https://misdake.github.io/ChipAnnotationViewer/?map=G70), [G71](https://misdake.github.io/ChipAnnotationViewer/?map=G71), [G72](https://misdake.github.io/ChipAnnotationViewer/?map=G72), [G73](https://misdake.github.io/ChipAnnotationViewer/?map=G73)
    - (Tesla) [G80](https://misdake.github.io/ChipAnnotationViewer/?map=G80), [G84](https://misdake.github.io/ChipAnnotationViewer/?map=G84), [G86](https://misdake.github.io/ChipAnnotationViewer/?map=G86), [G92](https://misdake.github.io/ChipAnnotationViewer/?map=G92), [G94](https://misdake.github.io/ChipAnnotationViewer/?map=G94), [GT200](https://misdake.github.io/ChipAnnotationViewer/?map=GT200), [GT218](https://misdake.github.io/ChipAnnotationViewer/?map=GT218)
    - (Fermi) [GF100](https://misdake.github.io/ChipAnnotationViewer/?map=GF100), [GF106](https://misdake.github.io/ChipAnnotationViewer/?map=GF106), [GF108](https://misdake.github.io/ChipAnnotationViewer/?map=GF108), [GF114](https://misdake.github.io/ChipAnnotationViewer/?map=GF114)
    - (Kepler) [GK104](https://misdake.github.io/ChipAnnotationViewer/?map=GK104), [GK106](https://misdake.github.io/ChipAnnotationViewer/?map=GK106), [GK110](https://misdake.github.io/ChipAnnotationViewer/?map=GK110)
    - (Maxwell) [GM107](https://misdake.github.io/ChipAnnotationViewer/?map=GM107), [GM200](https://misdake.github.io/ChipAnnotationViewer/?map=GM200), [GM204](https://misdake.github.io/ChipAnnotationViewer/?map=GM204)
    - (Pascal) [GP102](https://misdake.github.io/ChipAnnotationViewer/?map=GP102), [GP104](https://misdake.github.io/ChipAnnotationViewer/?map=GP104), [GP106](https://misdake.github.io/ChipAnnotationViewer/?map=GP106)
    - (Turing) [TU102](https://misdake.github.io/ChipAnnotationViewer/?map=TU102), [TU104](https://misdake.github.io/ChipAnnotationViewer/?map=TU104), [TU106](https://misdake.github.io/ChipAnnotationViewer/?map=TU106), [TU116](https://misdake.github.io/ChipAnnotationViewer/?map=TU116)
- Console:
    - (Microsoft) , [Xbox_Series_X](https://misdake.github.io/ChipAnnotationViewer/?map=Xbox_Series_X)
    - (Sony) [RSX(PS3)](https://misdake.github.io/ChipAnnotationViewer/?map=RSX), [PS4](https://misdake.github.io/ChipAnnotationViewer/?map=PS4), [PS4Pro](https://misdake.github.io/ChipAnnotationViewer/?map=PS4Pro)

Extra links:
- Image storage: <https://github.com/misdake/ChipAnnotationData>, [Data2](https://github.com/misdake/ChipAnnotationData2), [Data3](https://github.com/misdake/ChipAnnotationData3)
- Image processor: <https://github.com/misdake/ChipAnnotationTool>
