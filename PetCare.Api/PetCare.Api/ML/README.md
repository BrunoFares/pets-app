Local pet-audio inference assets live here.

`predict_pet_audio.py` supports two model formats:

- `models/best_model.pth` for the Torch CNN checkpoint path that the backend already knows how to call.
- `models/reference_model.json` as a lightweight local fallback so development environments can produce predictions without a separate `audio-ml` checkout.

To provision the local Python runtime on this machine, run:

```bash
./ML/setup_local_env.sh
```

The setup script creates an isolated `ML/.venv` and installs the packages from `ML/requirements.txt`. If you later want to switch back to a trained Torch model, drop the checkpoint in `ML/models/best_model.pth` or point `PetTranslator:ModelPath` at a different file.
