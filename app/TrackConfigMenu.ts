import { useState } from 'react';

export default function TrackConfigMenu({ onConfigChange }) {
  const [trackConfig, setTrackConfig] = useState({
    Track: 0,
    Instrumental: 0,
    Standard: 69,
    Highest: 127,
    Offsets: { Volume: 1.0, VolumeConstant: false, Pitch: 0.0, PitchConstant: false },
    Loop: { Enable: false, LoopOffset: 0 },
    Speed: 1.0,
    StripAfter: 0,
    StripBefore: 0,
    StartAt: 0,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTrackConfig((prevConfig) => ({
      ...prevConfig,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = () => {
    onConfigChange(trackConfig);
  };

  return (
    <div className="card mt-3">
      <div className="card-body">
        <h5 className="card-title">Track Config</h5>

        <div className="mb-3">
          <label htmlFor="track" className="form-label">Track Number</label>
          <input
            type="number"
            className="form-control"
            id="track"
            name="Track"
            value={trackConfig.Track}
            onChange={handleInputChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="instrumental" className="form-label">Instrumental</label>
          <input
            type="number"
            className="form-control"
            id="instrumental"
            name="Instrumental"
            value={trackConfig.Instrumental}
            onChange={handleInputChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="standard" className="form-label">Standard Pitch</label>
          <input
            type="number"
            className="form-control"
            id="standard"
            name="Standard"
            value={trackConfig.Standard}
            onChange={handleInputChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="highest" className="form-label">Highest Pitch</label>
          <input
            type="number"
            className="form-control"
            id="highest"
            name="Highest"
            value={trackConfig.Highest}
            onChange={handleInputChange}
          />
        </div>

        <button className="btn btn-primary" onClick={handleSubmit}>
          Apply Config
        </button>
      </div>
    </div>
  );
}
